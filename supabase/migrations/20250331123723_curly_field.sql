/*
  # Schema inicial do marketplace de serviços

  1. Novas Tabelas
    - Perfis de usuários
    - Categorias e subcategorias
    - Serviços e imagens
    - Visualizações e histórico
    
  2. Funções e Triggers
    - Atualização automática de timestamps
    - Controle de imagens destacadas
    - Rastreamento de mudanças de status
*/

-- Verificar e criar tipo service_status
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_status') THEN
    CREATE TYPE service_status AS ENUM ('active', 'inactive', 'pending');
  END IF;
END $$;

-- Verificar e criar tabelas
DO $$
BEGIN
  -- Profiles
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles') THEN
    CREATE TABLE profiles (
      id uuid PRIMARY KEY REFERENCES auth.users(id),
      full_name text NOT NULL,
      company_name text,
      phone text NOT NULL,
      email text NOT NULL,
      bio text,
      role text NOT NULL DEFAULT 'user',
      status char(1) NOT NULL DEFAULT 'S',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT valid_profile_role CHECK (role IN ('user', 'admin')),
      CONSTRAINT valid_profile_status CHECK (status IN ('S', 'N'))
    );
  END IF;

  -- Main Categories
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_categories') THEN
    CREATE TABLE main_categories (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      slug text NOT NULL,
      created_at timestamptz DEFAULT now(),
      CONSTRAINT main_categories_name_key UNIQUE (name),
      CONSTRAINT main_categories_slug_key UNIQUE (slug)
    );
  END IF;

  -- Sub Categories
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'sub_categories') THEN
    CREATE TABLE sub_categories (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      main_category_id uuid NOT NULL REFERENCES main_categories(id),
      name text NOT NULL,
      slug text NOT NULL,
      created_at timestamptz DEFAULT now(),
      CONSTRAINT sub_categories_slug_key UNIQUE (slug)
    );
  END IF;

  -- Services
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'services') THEN
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
  END IF;

  -- Service Images
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'service_images') THEN
    CREATE TABLE service_images (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      url text NOT NULL,
      is_featured boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;

  -- Service Views
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'service_views') THEN
    CREATE TABLE service_views (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      viewer_id uuid REFERENCES auth.users(id),
      ip_address text,
      user_agent text,
      viewed_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;

  -- Service Status History
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'service_status_history') THEN
    CREATE TABLE service_status_history (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      old_status service_status,
      new_status service_status NOT NULL,
      changed_by uuid REFERENCES auth.users(id),
      changed_at timestamptz NOT NULL DEFAULT now(),
      reason text
    );
  END IF;
END $$;

-- Criar índices se não existirem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_service_featured_image') THEN
    CREATE UNIQUE INDEX idx_service_featured_image ON service_images (service_id) WHERE is_featured = true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_services_profile_id') THEN
    CREATE INDEX idx_services_profile_id ON services(profile_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_services_category_id') THEN
    CREATE INDEX idx_services_category_id ON services(category_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_services_status') THEN
    CREATE INDEX idx_services_status ON services(status);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_services_created_at') THEN
    CREATE INDEX idx_services_created_at ON services(created_at);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sub_categories_main_category_id') THEN
    CREATE INDEX idx_sub_categories_main_category_id ON sub_categories(main_category_id);
  END IF;
END $$;

-- Criar ou substituir funções e triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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

DROP TRIGGER IF EXISTS ensure_single_featured_image_trigger ON service_images;
CREATE TRIGGER ensure_single_featured_image_trigger
  BEFORE INSERT OR UPDATE ON service_images
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_featured_image();

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
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS track_service_status_changes ON services;
CREATE TRIGGER track_service_status_changes
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION track_service_status_changes();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    company_name,
    phone,
    email,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Criar bucket para armazenamento de imagens se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('services', 'services', true)
ON CONFLICT (id) DO NOTHING;