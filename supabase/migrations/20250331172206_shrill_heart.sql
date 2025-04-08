/*
  # Add status to profiles
  
  1. Changes
    - Add status column to profiles
    - Add constraint for valid status values
*/

-- Add status column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN status char(1) NOT NULL DEFAULT 'S';
  END IF;
END $$;

-- Add check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_profile_status'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT valid_profile_status 
    CHECK (status IN ('S', 'N'));
  END IF;
END $$;