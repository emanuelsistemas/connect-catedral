-- Drop existing constraints and indexes
ALTER TABLE services
  DROP CONSTRAINT IF EXISTS services_category_id_fkey;

ALTER TABLE sub_categories
  DROP CONSTRAINT IF EXISTS sub_categories_pkey CASCADE,
  DROP CONSTRAINT IF EXISTS sub_categories_main_category_id_fkey;

-- Drop existing indexes
DROP INDEX IF EXISTS idx_unique_subcategory_per_main;
DROP INDEX IF EXISTS idx_sub_categories_main_category_id;
DROP INDEX IF EXISTS idx_sub_categories_slug;

-- Recreate sub_categories table
DROP TABLE IF EXISTS sub_categories CASCADE;

CREATE TABLE sub_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  main_category_id uuid NOT NULL REFERENCES main_categories(id),
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create new indexes
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