-- Phase 1: 追加テーブルおよびカラム変更
-- マイグレーションとして実行

-- ===== 1. ユーザー住所テーブル（マイページから管理） =====
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  postal_code TEXT,
  prefecture TEXT,
  city TEXT,
  line1 TEXT,
  line2 TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own address" ON user_addresses FOR ALL USING (auth.uid() = user_id);

-- ===== 2. 通報テーブル =====
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES profiles(id) NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'item', 'trade')),
  target_id UUID NOT NULL, -- user.id / user_items.id / trades.id
  reason TEXT NOT NULL,
  detail TEXT,
  status TEXT DEFAULT 'OPEN', -- OPEN, REVIEWING, RESOLVED, DISMISSED
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view their own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);

-- ===== 3. お問い合わせテーブル =====
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email TEXT,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'NEW', -- NEW, IN_PROGRESS, RESOLVED
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create contact messages" ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own messages" ON contact_messages FOR SELECT USING (auth.uid() = user_id);

-- ===== 4. reviewsテーブルのreviewed_idカラム追加（既存スキーマとの互換性） =====
-- 既存スキーマがreviewee_idを使用している場合:
-- ALTER TABLE reviews RENAME COLUMN reviewee_id TO reviewed_id;
-- 新規作成の場合は不要

-- ===== 5. tradesテーブルに発送関連カラム追加 =====
ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS proposer_shipped BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS receiver_shipped BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS proposer_received BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS receiver_received BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tracking_number_proposer TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number_receiver TEXT;

-- ===== 6. Supabase Storage バケット設定 =====
-- Supabase Dashboard で以下を実行:
-- 1. Storage > Create bucket > "avatars" (Public)
-- 2. Policies:
--    INSERT: auth.uid()::text = (storage.foldername(name))[1]
--    UPDATE: auth.uid()::text = (storage.foldername(name))[1]
--    SELECT: true (public)

-- ===== 7. blocksテーブルのRLS（既存テーブルに追加） =====
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own blocks" ON blocks FOR ALL USING (auth.uid() = blocker_id);
CREATE POLICY "Users can see if they are blocked" ON blocks FOR SELECT USING (auth.uid() = blocked_id);

-- ===== 8. reviewsテーブルのRLS（既存テーブルに追加） =====
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- ===== 9. disputesテーブルのRLS =====
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create disputes" ON disputes FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view their own disputes" ON disputes FOR SELECT USING (auth.uid() = reporter_id);
