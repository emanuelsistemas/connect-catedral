/*
  # Fix subcategories table structure
  
  1. Changes
    - Drop existing constraints and indexes safely
    - Recreate table with proper structure
    - Add correct indexes and constraints
    - Preserve existing data
    - Fix foreign key relationships
*/

-- First, drop the foreign key constraint from services
ALTER TABLE services
  DROP CONSTRAINT IF EXISTS services_category_id_fkey;

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_unique_subcategory_per_main;
DROP INDEX IF EXISTS idx_sub_categories_main_category_id;
DROP INDEX IF EXISTS sub_categories_name_key;
DROP INDEX IF EXISTS sub_categories_slug_key;

-- Create temporary table to store existing data
CREATE TABLE sub_categories_temp AS 
SELECT * FROM sub_categories;

-- Drop existing table
DROP TABLE sub_categories CASCADE;

-- Create new table with correct structure
CREATE TABLE sub_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  main_category_id uuid NOT NULL REFERENCES main_categories(id),
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Restore data from temp table
INSERT INTO sub_categories (id, main_category_id, name, slug, created_at)
SELECT id, main_category_id, name, slug, created_at
FROM sub_categories_temp;

-- Drop temp table
DROP TABLE sub_categories_temp;

-- Create necessary indexes
CREATE INDEX idx_sub_categories_main_category_id 
  ON sub_categories(main_category_id);

CREATE UNIQUE INDEX idx_unique_subcategory_per_main 
  ON sub_categories (main_category_id, name);

CREATE UNIQUE INDEX idx_sub_categories_slug 
  ON sub_categories(slug);

-- Recreate foreign key constraint on services
ALTER TABLE services
  ADD CONSTRAINT services_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES sub_categories(id);

-- Ensure RLS is disabled
ALTER TABLE main_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE sub_categories DISABLE ROW LEVEL SECURITY;