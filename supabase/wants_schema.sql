-- WANTリスト（欲しいアイテム管理）
CREATE TABLE wants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  catalog_item_id UUID REFERENCES catalog_items(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, catalog_item_id)
);

-- RLS
ALTER TABLE wants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all wants" ON wants FOR SELECT USING (true);
CREATE POLICY "Users can manage own wants" ON wants FOR ALL USING (auth.uid() = user_id);
