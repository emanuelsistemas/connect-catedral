/*
  # Fix Admin Panel Database Issues

  1. Changes
    - Add missing RLS policies for admin access
    - Fix user profile queries
    - Add email column to profiles table
*/

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Add RLS policies for auth.users access
CREATE POLICY "Admins can read auth.users"
  ON auth.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Add email column to profiles if not exists
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email text;