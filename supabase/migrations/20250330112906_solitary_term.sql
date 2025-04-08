/*
  # Enhance profiles table with additional fields
  
  1. Changes
    - Add company_name field to profiles table
    - Update handle_new_user function to include new fields
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS company_name text;

-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    company_name,
    phone,
    email,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;