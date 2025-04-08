/*
  # Initial database setup
  
  1. Changes
    - Create service_status enum type
    - Create profiles table with basic structure
*/

-- Create service_status enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_status') THEN
    CREATE TYPE service_status AS ENUM ('active', 'inactive', 'pending');
  END IF;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text NOT NULL,
  company_name text,
  phone text NOT NULL,
  email text NOT NULL,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);