/*
  # Auth Profile Creation and Storage Setup

  1. New Trigger
    - Creates a profile automatically when a new user signs up
    - Links the profile to the auth.users table

  2. Storage
    - Creates a bucket for service images
    - Sets up appropriate security policies
*/

-- Create a trigger to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists (to avoid conflicts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for service images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('services', 'services', true)
ON CONFLICT (id) DO NOTHING;

-- Enable public access to the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'services');

-- Enable authenticated users to upload files
CREATE POLICY "Authenticated Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'services');

-- Enable authenticated users to update their own files
CREATE POLICY "Authenticated Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'services')
WITH CHECK (bucket_id = 'services');

-- Enable authenticated users to delete their own files
CREATE POLICY "Authenticated Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'services');