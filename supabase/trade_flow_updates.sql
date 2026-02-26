-- ==========================================
-- 取引プロセスの厳格化と機能追加に伴うスキーマ変更
-- 本ファイルをSupabase SQL Editorで実行してください
-- ==========================================

-- 1. user_items へのステータス追加
ALTER TABLE user_items 
ADD COLUMN IF NOT EXISTS trade_status TEXT DEFAULT 'AVAILABLE' CHECK (trade_status IN ('AVAILABLE', 'TRADING', 'COMPLETED'));

-- 2. user_addresses テーブル追加（ユーザー単位の住所保存）
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  prefecture TEXT NOT NULL,
  city TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: アドレスは自分と、取引（ACCEPTED以上）がある相手のみ閲覧可能
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分の住所は自分がフルアクセス" ON user_addresses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "取引相手の住所は取引成立時のみ閲覧可能" ON user_addresses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trades
      WHERE (trades.proposer_id = auth.uid() OR trades.receiver_id = auth.uid())
        AND (trades.proposer_id = user_addresses.user_id OR trades.receiver_id = user_addresses.user_id)
        AND trades.status IN ('ACCEPTED', 'SHIPPED', 'COMPLETED', 'DISPUTE')
    )
  );

-- 3. trades テーブルに発送・受取フラグを追加
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS proposer_shipped BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS receiver_shipped BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS proposer_received BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS receiver_received BOOLEAN DEFAULT FALSE;

-- 4. notifications テーブル追加
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'proposal', 'message', 'status', 'system'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  related_id UUID, -- trade_idなどへの参照用（外部キー制約なし）
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "通知は自分のみ閲覧・更新可能" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- Realtime有効化
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 5. トリガー関数: 取引ステータス変更時のアイテム状態自動更新
CREATE OR REPLACE FUNCTION handle_trade_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- ステータスが ACCEPTED になった場合
  IF NEW.status = 'ACCEPTED' AND OLD.status != 'ACCEPTED' THEN
    UPDATE user_items SET trade_status = 'TRADING' WHERE id IN (NEW.proposer_item_id, NEW.receiver_item_id);
  -- ステータスが COMPLETED になった場合
  ELSIF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
    UPDATE user_items SET trade_status = 'COMPLETED' WHERE id IN (NEW.proposer_item_id, NEW.receiver_item_id);
  -- ステータスが CANCELLED または DISPUTE戻り などでキャンセルされた場合
  ELSIF NEW.status = 'CANCELLED' AND OLD.status IN ('PROPOSED', 'ACCEPTED', 'SHIPPED') THEN
    -- ここでは単純に戻すが、実際により複雑なケースでは他取引がないか確認が必要
    UPDATE user_items SET trade_status = 'AVAILABLE' WHERE id IN (NEW.proposer_item_id, NEW.receiver_item_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_trade_status_change ON trades;
CREATE TRIGGER on_trade_status_change
  AFTER UPDATE OF status ON trades
  FOR EACH ROW EXECUTE FUNCTION handle_trade_status_change();

-- 6. トリガー関数: 取引ステータス変更時の通知自動生成
CREATE OR REPLACE FUNCTION notify_trade_status_change()
RETURNS TRIGGER AS $$
DECLARE
  proposer_name TEXT;
  receiver_name TEXT;
  msg_title TEXT;
  msg_body TEXT;
BEGIN
  -- 変更があったのみ実行
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  SELECT display_name INTO proposer_name FROM profiles WHERE id = NEW.proposer_id;
  SELECT display_name INTO receiver_name FROM profiles WHERE id = NEW.receiver_id;

  -- ACCEPTEDのとき
  IF NEW.status = 'ACCEPTED' THEN
    -- 提案者へ通知
    INSERT INTO notifications (user_id, type, title, body, related_id)
    VALUES (NEW.proposer_id, 'status', '取引が成立しました！', receiver_name || 'さんがあなたの提案を承諾しました。住所をお互いに確認してください。', NEW.id);
    -- 受信者へ通知（承諾した本人だけど一応）
    INSERT INTO notifications (user_id, type, title, body, related_id)
    VALUES (NEW.receiver_id, 'status', '取引が成立しました！', '取引ルームで手続きを進めてください。', NEW.id);

  -- CANCELLEDのとき
  ELSIF NEW.status = 'CANCELLED' THEN
    INSERT INTO notifications (user_id, type, title, body, related_id)
    VALUES (NEW.proposer_id, 'status', '取引がキャンセルされました', '提案はキャンセル・辞退されました。', NEW.id);
  
  -- SHIPPED, COMPLETED などはアプリケーション側の処理で送るか必要に応じてここに追加
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_trade_notify_status ON trades;
CREATE TRIGGER on_trade_notify_status
  AFTER UPDATE OF status ON trades
  FOR EACH ROW EXECUTE FUNCTION notify_trade_status_change();

-- 7. トリガー関数: 新規コメント追加時の通知生成
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  trade_record RECORD;
  target_user_id UUID;
  sender_name TEXT;
BEGIN
  -- tradeレコード取得
  SELECT * INTO trade_record FROM trades WHERE id = NEW.trade_id;
  -- 送信者名取得
  SELECT display_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;

  -- 受信先決定
  IF NEW.sender_id = trade_record.proposer_id THEN
    target_user_id := trade_record.receiver_id;
  ELSE
    target_user_id := trade_record.proposer_id;
  END IF;

  -- 通知生成
  INSERT INTO notifications (user_id, type, title, body, related_id)
  VALUES (target_user_id, 'message', '新しいメッセージ', sender_name || 'さんからメッセージが届きました', NEW.trade_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_trade_message ON trade_messages;
CREATE TRIGGER on_new_trade_message
  AFTER INSERT ON trade_messages
  FOR EACH ROW EXECUTE FUNCTION notify_new_message();

-- 8. トリガー関数: 新規提案作成時の通知生成
CREATE OR REPLACE FUNCTION notify_new_proposal()
RETURNS TRIGGER AS $$
DECLARE
  proposer_name TEXT;
BEGIN
  SELECT display_name INTO proposer_name FROM profiles WHERE id = NEW.proposer_id;

  INSERT INTO notifications (user_id, type, title, body, related_id)
  VALUES (NEW.receiver_id, 'proposal', '新しい交換提案が届きました', proposer_name || 'さんから交換の提案があります', NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_trade_proposed ON trades;
CREATE TRIGGER on_new_trade_proposed
  AFTER INSERT ON trades
  FOR EACH ROW EXECUTE FUNCTION notify_new_proposal();
