/*
  # Create categories tables
  
  1. Changes
    - Create main_categories table
    - Create sub_categories table
    - Add necessary indexes
*/

-- Create main_categories table
CREATE TABLE IF NOT EXISTS main_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create sub_categories table
CREATE TABLE IF NOT EXISTS sub_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  main_category_id uuid NOT NULL REFERENCES main_categories(id),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create index for main_category_id
CREATE INDEX IF NOT EXISTS idx_sub_categories_main_category_id 
ON sub_categories(main_category_id);