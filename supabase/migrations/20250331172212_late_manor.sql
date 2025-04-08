/*
  # Create services table
  
  1. Changes
    - Create services table
    - Create service_images table
    - Add necessary indexes
*/

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id),
  category_id uuid NOT NULL REFERENCES sub_categories(id),
  title text NOT NULL,
  description text NOT NULL,
  price decimal(10,2),
  is_budget boolean NOT NULL DEFAULT false,
  whatsapp text NOT NULL,
  email text NOT NULL,
  status service_status NOT NULL DEFAULT 'pending',
  views_count integer NOT NULL DEFAULT 0,
  whatsapp_clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_price_range CHECK (price IS NULL OR price >= 0)
);

-- Create service_images table
CREATE TABLE IF NOT EXISTS service_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  url text NOT NULL,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_services_profile_id ON services(profile_id);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at);