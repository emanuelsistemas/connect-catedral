/*
  # Add status field to profiles table

  1. Changes
    - Add status column to profiles table with default value 'S'
    - Add check constraint to ensure valid status values
    - Add comment explaining status values
*/

-- Add status column with default value 'S' if it doesn't exist
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

-- Add check constraint if it doesn't exist
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

-- Add comment to explain status values
COMMENT ON COLUMN profiles.status IS 'Profile status: S = Active, N = Inactive/Suspended';