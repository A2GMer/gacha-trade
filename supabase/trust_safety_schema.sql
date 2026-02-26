-- ==========================================
-- カタログ自動更新 + 信頼スコア + Stripeデポジット対応
-- ==========================================

-- 1. catalog_items テーブル拡張
ALTER TABLE catalog_items
ADD COLUMN IF NOT EXISTS price INTEGER,              -- 参考価格（1回あたり、円）
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual', -- データ取得元: 'scrape', 'user', 'manual'
ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2),  -- AI信頼スコア (0.00〜1.00)
ADD COLUMN IF NOT EXISTS jan_code TEXT;               -- JANコード（バンダイから取得可能）

-- source のバリデーション
ALTER TABLE catalog_items
ADD CONSTRAINT catalog_source_check CHECK (source IN ('scrape', 'user', 'manual'));

-- JANコード重複防止
CREATE UNIQUE INDEX IF NOT EXISTS idx_catalog_jan_code ON catalog_items(jan_code) WHERE jan_code IS NOT NULL;

-- 名前+メーカー重複防止
CREATE UNIQUE INDEX IF NOT EXISTS idx_catalog_name_manufacturer ON catalog_items(name, manufacturer);

-- 2. user_items の写真コメント修正（1枚以上に変更）
COMMENT ON COLUMN user_items.images IS '写真1枚以上';

-- 3. trades テーブル拡張（Stripeデポジット + 発送期限）
ALTER TABLE trades
ADD COLUMN IF NOT EXISTS proposer_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS receiver_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS shipment_deadline TIMESTAMP WITH TIME ZONE;
