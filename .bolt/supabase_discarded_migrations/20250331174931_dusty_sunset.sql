/*
  # Initial Schema Setup

  1. Tables
    - profiles (user profiles)
    - main_categories (main service categories)
    - sub_categories (subcategories)
    - services (service listings)
    - service_images (service photos)
    - service_views (view tracking)
    - service_status_history (status changes)

  2. Features
    - Automatic timestamps
    - Status tracking
    - Image management
    - View counting
*/

-- Create service_status enum
CREATE TYPE service_status AS ENUM ('active', 'inactive', 'pending');

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text NOT NULL,
  company_name text,
  phone text NOT NULL,
  email text NOT NULL,
  bio text,
  role text NOT NULL DEFAULT 'user',
  status char(1) NOT NULL DEFAULT 'S',
  admin char(1) NOT NULL DEFAULT 'N',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_profile_role CHECK (role IN ('user', 'admin')),
  CONSTRAINT valid_profile_status CHECK (status IN ('S', 'N')),
  CONSTRAINT valid_profile_admin CHECK (admin IN ('N', 'S'))
);

-- Create main_categories table
CREATE TABLE main_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT main_categories_name_key UNIQUE (name),
  CONSTRAINT main_categories_slug_key UNIQUE (slug)
);

-- Create sub_categories table
CREATE TABLE sub_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  main_category_id uuid NOT NULL REFERENCES main_categories(id),
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT sub_categories_slug_key UNIQUE (slug)
);

-- Create services table
CREATE TABLE services (
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
CREATE TABLE service_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  url text NOT NULL,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create service_views table
CREATE TABLE service_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id),
  ip_address text,
  user_agent text,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

-- Create service_status_history table
CREATE TABLE service_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  old_status service_status,
  new_status service_status NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  reason text
);

-- Create indexes
CREATE INDEX idx_sub_categories_main_category_id ON sub_categories(main_category_id);
CREATE INDEX idx_services_profile_id ON services(profile_id);
CREATE INDEX idx_services_category_id ON services(category_id);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_created_at ON services(created_at);
CREATE UNIQUE INDEX idx_service_featured_image ON service_images (service_id) WHERE is_featured = true;

-- Create functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION track_service_status_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO service_status_history (
      service_id,
      old_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ language plpgsql SECURITY DEFINER;

CREATE TRIGGER track_service_status_changes
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION track_service_status_changes();

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('services', 'services', true)
ON CONFLICT (id) DO NOTHING;