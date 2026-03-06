-- ユーザー登録時にプロフィールを自動作成するトリガー
-- Supabase SQL Editor で実行してください

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, x_username, display_name_source)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name', 
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name', 
      'ユーザー'
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      NULL
    ),
    NEW.raw_user_meta_data->>'preferred_username', -- Supabase OAuth (Twitter) returns handle here or in user_name
    CASE 
      WHEN NEW.raw_user_meta_data->>'preferred_username' IS NOT NULL THEN 'twitter'
      ELSE 'manual'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーの作成（既存の場合は一旦削除）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
