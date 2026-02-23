-- 拡張機能の有効化（UUID生成など）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ユーザープロフィールテーブル
-- Auth.usersと連携
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  rating_avg DECIMAL(3,2) DEFAULT 0,
  trade_count INTEGER DEFAULT 0,
  is_frozen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- カタログアイテムテーブル（メーカー、シリーズ、アイテム）
CREATE TABLE catalog_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  series TEXT NOT NULL,
  image_url TEXT,
  source_url TEXT,
  is_approved BOOLEAN DEFAULT TRUE, -- 手動追加申請の場合はFALSEにする
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザー所持アイテムテーブル
CREATE TABLE user_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  catalog_item_id UUID REFERENCES catalog_items(id) ON DELETE CASCADE NOT NULL,
  images TEXT[] NOT NULL, -- 写真4枚必須
  condition TEXT NOT NULL, -- 未開封/開封済/傷あり
  quantity INTEGER DEFAULT 1,
  memo TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  is_tradeable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 制約: is_tradeable=true の場合は is_public=true を強制（アプリケーション層でも制御するが、念のため）
  CONSTRAINT tradeable_must_be_public CHECK (NOT (is_tradeable = TRUE AND is_public = FALSE))
);

-- 取引テーブル
CREATE TYPE trade_status AS ENUM (
  'PROPOSED', 
  'ACCEPTED', 
  'ADDRESS_PENDING', 
  'ADDRESS_LOCKED', 
  'SHIPMENT_PENDING', 
  'SHIPPED', 
  'RECEIVED', 
  'COMPLETED', 
  'DISPUTE', 
  'CANCELLED'
);

CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposer_id UUID REFERENCES profiles(id) NOT NULL,
  receiver_id UUID REFERENCES profiles(id) NOT NULL,
  proposer_item_id UUID REFERENCES user_items(id) NOT NULL,
  receiver_item_id UUID REFERENCES user_items(id) NOT NULL,
  status trade_status DEFAULT 'PROPOSED' NOT NULL,
  proposer_address_id UUID, -- 後ほど trade_addresses テーブルへの参照として使用
  receiver_address_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 取引チャットメッセージ
CREATE TABLE trade_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 住所情報（暗号化して保存）
CREATE TABLE trade_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  encrypted_address TEXT NOT NULL,
  iv TEXT NOT NULL, -- AES GCM用初期化ベクトル
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 紛争情報
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES profiles(id) NOT NULL,
  reason TEXT NOT NULL,
  evidence_urls TEXT[],
  status TEXT DEFAULT 'OPEN', -- OPEN, RESOLVED, CLOSED
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ブロック情報
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- 評価情報
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) NOT NULL,
  reviewee_id UUID REFERENCES profiles(id) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trade_id, reviewer_id)
);

-- RLS (Row Level Security) の設定例
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profiles." ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE user_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public items are viewable by everyone." ON user_items FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view their own private items." ON user_items FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can manage their own items." ON user_items FOR ALL USING (auth.uid() = owner_id);

-- ダミーデータの挿入 (カタログ)
INSERT INTO catalog_items (name, manufacturer, series, image_url) VALUES
('ピカチュウ', 'ポケモン', 'カプセルフィギュア Vol.1', 'https://placeholder.com/pokemon1'),
('リザードン', 'ポケモン', 'カプセルフィギュア Vol.1', 'https://placeholder.com/pokemon2'),
('ちいかわ', 'ナガノ', 'ちいかわソフビフィギュア', 'https://placeholder.com/chiikawa1');
