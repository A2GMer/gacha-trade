-- Phase 2: ペナルティシステムスキーマ

-- ===== 1. ペナルティテーブル =====
CREATE TABLE IF NOT EXISTS penalties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('WARNING', 'RESTRICTION', 'FREEZE')),
  reason TEXT NOT NULL, -- 例: 未発送, 詐欺, 虚偽
  expires_at TIMESTAMP WITH TIME ZONE, -- RESTRICTION の場合の制限解除日
  created_by UUID REFERENCES profiles(id),  -- 運営者のID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own penalties" ON penalties FOR SELECT USING (auth.uid() = user_id);

-- ===== 2. ペナルティ自動判定用ビュー =====
-- 未発送有責裁定の回数をカウント
CREATE OR REPLACE VIEW user_penalty_counts AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE type = 'WARNING') AS warning_count,
  COUNT(*) FILTER (WHERE type = 'RESTRICTION') AS restriction_count,
  COUNT(*) FILTER (WHERE type = 'FREEZE') AS freeze_count,
  COUNT(*) AS total_count
FROM penalties
GROUP BY user_id;

-- ===== 3. 仕様書 §12 のペナルティルール =====
-- 未発送で有責裁定: 1回→WARNING, 2回→7日RESTRICTION, 3回→FREEZE
-- 詐欺/虚偽が濃厚: 即FREEZE
--
-- 運営画面から以下のように使用:
-- INSERT INTO penalties (user_id, trade_id, type, reason, expires_at, created_by)
-- VALUES ($userId, $tradeId, 'WARNING', '未発送', NULL, $adminId);
--
-- 2回目の場合:
-- INSERT INTO penalties (user_id, trade_id, type, reason, expires_at, created_by)
-- VALUES ($userId, $tradeId, 'RESTRICTION', '未発送（2回目）', NOW() + INTERVAL '7 days', $adminId);
--
-- 3回目 or 詐欺:
-- INSERT INTO penalties (user_id, trade_id, type, reason, created_by)
-- VALUES ($userId, $tradeId, 'FREEZE', '未発送（3回目）', $adminId);
-- UPDATE profiles SET is_frozen = TRUE WHERE id = $userId;

-- ===== 4. 取引テーブルに期限関連カラム追加 =====
ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS address_deadline TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS shipment_deadline TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS receipt_deadline TIMESTAMP WITH TIME ZONE;

-- ACCEPTED時に自動設定するトリガー
CREATE OR REPLACE FUNCTION set_trade_deadlines()
RETURNS TRIGGER AS $$
BEGIN
  -- ステータスがACCEPTEDに変わった時
  IF NEW.status = 'ACCEPTED' AND (OLD.status IS NULL OR OLD.status != 'ACCEPTED') THEN
    NEW.address_deadline := NOW() + INTERVAL '48 hours';
  END IF;

  -- ADDRESS_LOCKEDに変わった時
  IF NEW.status = 'ADDRESS_LOCKED' AND (OLD.status IS NULL OR OLD.status != 'ADDRESS_LOCKED') THEN
    NEW.shipment_deadline := NOW() + INTERVAL '5 days';
  END IF;

  -- SHIPPEDに変わった時
  IF NEW.status = 'SHIPPED' AND (OLD.status IS NULL OR OLD.status != 'SHIPPED') THEN
    NEW.receipt_deadline := NOW() + INTERVAL '3 days';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trade_deadline_trigger ON trades;
CREATE TRIGGER trade_deadline_trigger
  BEFORE UPDATE ON trades
  FOR EACH ROW
  EXECUTE FUNCTION set_trade_deadlines();
