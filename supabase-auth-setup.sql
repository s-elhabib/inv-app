-- First, update the profiles table to include a role column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'client';

-- Create a trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.email, 'client');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create admin and client users (run this in SQL Editor)
-- Note: In production, you would use Supabase Auth UI or API to create users
-- This is just for development/testing purposes

-- To create an admin user, first create the user through Supabase Auth
-- Then update their profile:
UPDATE public.profiles
SET role = 'admin'
WHERE id = '[ADMIN_USER_UUID]';  -- Replace with actual UUID after creating the user

-- To create a client user, use Supabase Auth UI or API
-- The trigger will automatically create a profile with role='client'