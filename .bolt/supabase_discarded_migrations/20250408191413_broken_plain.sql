/*
  # Add admin RLS policies
  
  1. Changes
    - Add RLS policies for admin users to manage categories
    - Ensure only admin users can create/modify categories
    
  2. Security
    - Check admin status in profiles table
    - Maintain existing public read access
*/

-- Add RLS policies for main_categories
CREATE POLICY "Admins can manage main categories"
  ON main_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND admin = 'S'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND admin = 'S'
    )
  );

-- Add RLS policies for sub_categories
CREATE POLICY "Admins can manage sub categories"
  ON sub_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND admin = 'S'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND admin = 'S'
    )
  );