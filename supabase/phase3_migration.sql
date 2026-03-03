-- phase3_migration.sql
-- Setting up Admin roles

-- 1. Add 'role' column to profiles if it doesn't exist
-- We use a simple text domain: 'user' or 'admin'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user' NOT NULL;
    END IF;
END $$;

-- 2. (Optional) Create a helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
    RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
