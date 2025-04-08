/*
  # Update services and images tables

  This migration ensures the services and service_images tables exist with proper structure and policies.
  It uses conditional checks to avoid errors if objects already exist.

  1. Tables
    - Checks if tables exist before creating
    - Adds RLS if not already enabled
    - Sets up proper relationships and constraints

  2. Policies
    - Creates policies if they don't exist
    - Ensures proper access control for public and authenticated users

  3. Triggers
    - Sets up triggers for updated_at and featured image management
*/

-- Check and create services table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'services') THEN
    CREATE TABLE services (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      profile_id uuid NOT NULL REFERENCES profiles(id),
      category_id uuid NOT NULL REFERENCES categories(id),
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
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    ALTER TABLE services ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Check and create service_images table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'service_images') THEN
    CREATE TABLE service_images (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      url text NOT NULL,
      is_featured boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    ALTER TABLE service_images ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies if they don't exist
DO $$ 
BEGIN
  -- Services policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'services' 
    AND policyname = 'Permitir leitura pública de serviços ativos'
  ) THEN
    CREATE POLICY "Permitir leitura pública de serviços ativos"
      ON services
      FOR SELECT
      TO public
      USING (status = 'active');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'services' 
    AND policyname = 'Prestadores podem gerenciar seus serviços'
  ) THEN
    CREATE POLICY "Prestadores podem gerenciar seus serviços"
      ON services
      FOR ALL
      TO authenticated
      USING (profile_id IN (
        SELECT id FROM profiles WHERE id = auth.uid()
      ))
      WITH CHECK (profile_id IN (
        SELECT id FROM profiles WHERE id = auth.uid()
      ));
  END IF;

  -- Service images policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_images' 
    AND policyname = 'Permitir leitura pública de imagens'
  ) THEN
    CREATE POLICY "Permitir leitura pública de imagens"
      ON service_images
      FOR SELECT
      TO public
      USING (
        service_id IN (
          SELECT id FROM services WHERE status = 'active'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_images' 
    AND policyname = 'Prestadores podem gerenciar suas imagens'
  ) THEN
    CREATE POLICY "Prestadores podem gerenciar suas imagens"
      ON service_images
      FOR ALL
      TO authenticated
      USING (
        service_id IN (
          SELECT id FROM services 
          WHERE profile_id IN (
            SELECT id FROM profiles WHERE id = auth.uid()
          )
        )
      )
      WITH CHECK (
        service_id IN (
          SELECT id FROM services 
          WHERE profile_id IN (
            SELECT id FROM profiles WHERE id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- Create or replace triggers and functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_services_updated_at'
  ) THEN
    CREATE TRIGGER update_services_updated_at
      BEFORE UPDATE ON services
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION ensure_single_featured_image()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_featured THEN
    UPDATE service_images
    SET is_featured = false
    WHERE service_id = NEW.service_id
    AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'ensure_single_featured_image_trigger'
  ) THEN
    CREATE TRIGGER ensure_single_featured_image_trigger
      BEFORE INSERT OR UPDATE ON service_images
      FOR EACH ROW
      EXECUTE FUNCTION ensure_single_featured_image();
  END IF;
END $$;