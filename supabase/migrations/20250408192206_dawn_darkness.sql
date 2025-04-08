/*
  # Fix subcategories table with proper cascade handling
  
  1. Changes
    - Drop dependent constraints first
    - Recreate table with correct structure
    - Preserve existing data
    - Add necessary indexes and constraints
*/

-- Drop service references first
ALTER TABLE services
  DROP CONSTRAINT IF EXISTS services_category_id_fkey;

-- Drop constraints and indexes
ALTER TABLE IF EXISTS sub_categories 
  DROP CONSTRAINT IF EXISTS sub_categories_slug_key,
  DROP CONSTRAINT IF EXISTS sub_categories_name_key;

DROP INDEX IF EXISTS idx_unique_subcategory_per_main;
DROP INDEX IF EXISTS idx_sub_categories_main_category_id;

-- Create new table
CREATE TABLE IF NOT EXISTS sub_categories_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  main_category_id uuid NOT NULL REFERENCES main_categories(id),
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Copy data from old table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sub_categories') THEN
    INSERT INTO sub_categories_new (id, main_category_id, name, slug, created_at)
    SELECT id, main_category_id, name, slug, created_at
    FROM sub_categories;
  END IF;
END $$;

-- Drop old table with cascade
DROP TABLE IF EXISTS sub_categories CASCADE;
ALTER TABLE sub_categories_new RENAME TO sub_categories;

-- Create new indexes
CREATE INDEX idx_sub_categories_main_category_id ON sub_categories(main_category_id);
CREATE UNIQUE INDEX idx_unique_subcategory_per_main ON sub_categories (main_category_id, name);
CREATE UNIQUE INDEX idx_sub_categories_slug ON sub_categories(slug);

-- Disable RLS
ALTER TABLE main_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE sub_categories DISABLE ROW LEVEL SECURITY;

-- Recreate service reference
ALTER TABLE services
  ADD CONSTRAINT services_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES sub_categories(id);