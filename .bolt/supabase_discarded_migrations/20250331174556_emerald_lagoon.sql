-- Criar enum para status do serviço
CREATE TYPE service_status AS ENUM ('active', 'inactive', 'pending');

-- Criar tabela de perfis
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

-- Criar tabela de categorias principais
CREATE TABLE main_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT main_categories_name_key UNIQUE (name),
  CONSTRAINT main_categories_slug_key UNIQUE (slug)
);

-- Criar tabela de subcategorias
CREATE TABLE sub_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  main_category_id uuid NOT NULL REFERENCES main_categories(id),
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT sub_categories_slug_key UNIQUE (slug)
);

-- Criar tabela de serviços
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

-- Criar tabela de imagens
CREATE TABLE service_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  url text NOT NULL,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Criar índice único parcial para garantir apenas uma imagem destacada por serviço
CREATE UNIQUE INDEX idx_service_featured_image 
ON service_images (service_id) 
WHERE is_featured = true;

-- Criar tabela de visualizações
CREATE TABLE service_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id),
  ip_address text,
  user_agent text,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

-- Criar tabela de histórico de status
CREATE TABLE service_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  old_status service_status,
  new_status service_status NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  reason text
);

-- Criar índices
CREATE INDEX idx_sub_categories_main_category_id ON sub_categories(main_category_id);
CREATE INDEX idx_services_profile_id ON services(profile_id);
CREATE INDEX idx_services_category_id ON services(category_id);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_created_at ON services(created_at);

-- Criar funções e triggers
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

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE main_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_status_history ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Perfis públicos são visíveis para todos"
  ON profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Usuários podem editar próprio perfil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Serviços ativos são visíveis para todos"
  ON services FOR SELECT
  TO public
  USING (status = 'active');

CREATE POLICY "Prestadores podem gerenciar próprios serviços"
  ON services FOR ALL
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Imagens de serviços ativos são visíveis para todos"
  ON service_images FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = service_images.service_id
      AND services.status = 'active'
    )
  );

CREATE POLICY "Prestadores podem gerenciar imagens dos próprios serviços"
  ON service_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = service_images.service_id
      AND services.profile_id = auth.uid()
    )
  );

CREATE POLICY "Allow public read access to main categories"
  ON main_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to sub categories"
  ON sub_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can create service views"
  ON service_views FOR INSERT
  TO public
  WITH CHECK (
    service_id IN (
      SELECT id FROM services WHERE status = 'active'
    )
  );

CREATE POLICY "Service owners can view their service views"
  ON service_views FOR SELECT
  TO authenticated
  USING (
    service_id IN (
      SELECT id FROM services WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Service owners can view their service status history"
  ON service_status_history FOR SELECT
  TO authenticated
  USING (
    service_id IN (
      SELECT id FROM services WHERE profile_id = auth.uid()
    )
  );

-- Criar storage bucket para imagens
INSERT INTO storage.buckets (id, name, public)
VALUES ('services', 'services', true)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas de storage
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'services');

CREATE POLICY "Authenticated Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'services');

CREATE POLICY "Authenticated Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'services')
WITH CHECK (bucket_id = 'services');

CREATE POLICY "Authenticated Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'services');