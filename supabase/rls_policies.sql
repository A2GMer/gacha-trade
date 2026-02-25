-- ===================================
-- 追加RLSポリシー
-- Supabase SQL Editor で実行してください
-- ===================================

-- trades テーブル
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "当事者のみ取引を閲覧可能" ON trades
  FOR SELECT USING (auth.uid() = proposer_id OR auth.uid() = receiver_id);

CREATE POLICY "認証済みユーザーは提案を作成可能" ON trades
  FOR INSERT WITH CHECK (auth.uid() = proposer_id);

CREATE POLICY "当事者のみ取引を更新可能" ON trades
  FOR UPDATE USING (auth.uid() = proposer_id OR auth.uid() = receiver_id);

-- trade_messages テーブル
ALTER TABLE trade_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "取引の当事者のみメッセージを閲覧可能" ON trade_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trades
      WHERE trades.id = trade_messages.trade_id
      AND (trades.proposer_id = auth.uid() OR trades.receiver_id = auth.uid())
    )
  );

CREATE POLICY "取引の当事者のみメッセージを送信可能" ON trade_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM trades
      WHERE trades.id = trade_messages.trade_id
      AND (trades.proposer_id = auth.uid() OR trades.receiver_id = auth.uid())
    )
  );

-- trade_addresses テーブル
ALTER TABLE trade_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "取引の当事者のみ住所を閲覧可能" ON trade_addresses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trades
      WHERE trades.id = trade_addresses.trade_id
      AND (trades.proposer_id = auth.uid() OR trades.receiver_id = auth.uid())
    )
  );

CREATE POLICY "取引の当事者のみ住所を登録可能" ON trade_addresses
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM trades
      WHERE trades.id = trade_addresses.trade_id
      AND (trades.proposer_id = auth.uid() OR trades.receiver_id = auth.uid())
    )
  );

-- catalog_items テーブル（読み取りのみ全員許可）
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "カタログは全員閲覧可能" ON catalog_items
  FOR SELECT USING (true);

-- disputes テーブル
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "紛争は当事者のみ閲覧可能" ON disputes
  FOR SELECT USING (
    reporter_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM trades
      WHERE trades.id = disputes.trade_id
      AND (trades.proposer_id = auth.uid() OR trades.receiver_id = auth.uid())
    )
  );

CREATE POLICY "認証済みユーザーのみ紛争を提起可能" ON disputes
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- blocks テーブル
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分のブロックのみ閲覧可能" ON blocks
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "認証済みユーザーのみブロック可能" ON blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "自分のブロックのみ解除可能" ON blocks
  FOR DELETE USING (auth.uid() = blocker_id);

-- reviews テーブル
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "評価は全員閲覧可能" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "認証済みユーザーのみ評価可能" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Realtime を有効化（trade_messages のリアルタイム通知用）
ALTER PUBLICATION supabase_realtime ADD TABLE trade_messages;
