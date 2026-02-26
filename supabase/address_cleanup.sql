-- ==========================================
-- 住所自動削除（取引完了後7日）
-- ==========================================

-- 取引完了後7日経過した住所を削除する関数
CREATE OR REPLACE FUNCTION cleanup_expired_addresses()
RETURNS void AS $$
BEGIN
  -- trade_addresses: 取引完了から7日経過したものを削除
  DELETE FROM trade_addresses
  WHERE trade_id IN (
    SELECT id FROM trades
    WHERE status = 'COMPLETED'
      AND updated_at < NOW() - INTERVAL '7 days'
  );

  -- user_addresses: 全取引完了から7日経過かつ進行中取引がないユーザーの住所を削除
  DELETE FROM user_addresses
  WHERE user_id NOT IN (
    SELECT DISTINCT proposer_id FROM trades WHERE status IN ('ACCEPTED', 'SHIPPED', 'DISPUTE')
    UNION
    SELECT DISTINCT receiver_id FROM trades WHERE status IN ('ACCEPTED', 'SHIPPED', 'DISPUTE')
  )
  AND user_id IN (
    SELECT DISTINCT proposer_id FROM trades WHERE status = 'COMPLETED' AND updated_at < NOW() - INTERVAL '7 days'
    UNION
    SELECT DISTINCT receiver_id FROM trades WHERE status = 'COMPLETED' AND updated_at < NOW() - INTERVAL '7 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- pg_cron で毎日深夜3時に実行（Supabase Dashboard > Database > Extensions で pg_cron を有効化後）
-- SELECT cron.schedule('cleanup-addresses', '0 3 * * *', 'SELECT cleanup_expired_addresses()');

-- ==========================================
-- RLSポリシー強化: 本人確認済みユーザー間のみ住所閲覧可能
-- ==========================================
DROP POLICY IF EXISTS "取引相手の住所は取引成立時のみ閲覧可能" ON user_addresses;

CREATE POLICY "取引相手の住所は本人確認済み間のみ閲覧可能" ON user_addresses
  FOR SELECT USING (
    -- 自分の住所は常に見える
    auth.uid() = user_id
    OR
    -- 取引相手かつ双方が本人確認済み
    (
      EXISTS (
        SELECT 1 FROM trades
        WHERE (trades.proposer_id = auth.uid() OR trades.receiver_id = auth.uid())
          AND (trades.proposer_id = user_addresses.user_id OR trades.receiver_id = user_addresses.user_id)
          AND trades.status IN ('ACCEPTED', 'SHIPPED', 'COMPLETED', 'DISPUTE')
      )
      AND EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND phone_verified = true
      )
      AND EXISTS (
        SELECT 1 FROM profiles WHERE id = user_addresses.user_id AND phone_verified = true
      )
    )
  );
