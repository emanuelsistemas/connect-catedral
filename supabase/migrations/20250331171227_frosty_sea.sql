/*
  # Schema inicial do marketplace de serviços

  1. Novas Tabelas
    - `profiles`
      - Armazena informações dos prestadores de serviços
      - Campos para perfil, contato e métricas
    
    - `services`
      - Armazena os serviços oferecidos
      - Relacionado com perfil do prestador
      - Inclui descrição, preço, categoria
    
    - `service_images`
      - Armazena URLs das imagens dos serviços
      - Relacionado com serviço específico
    
    - `categories`
      - Lista de categorias/segmentos disponíveis
    
    - `service_views`
      - Registra visualizações de serviços
      - Métricas para análise

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas específicas para cada operação
*/

-- Criar enum para status do serviço se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_status') THEN
    CREATE TYPE service_status AS ENUM ('active', 'inactive', 'pending');
  END IF;
END $$;

-- Tabela de perfis
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text NOT NULL,
  phone text NOT NULL,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Tabela de serviços
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) NOT NULL,
  category_id uuid REFERENCES categories(id) NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  price numeric,
  status service_status DEFAULT 'active',
  views_count integer DEFAULT 0,
  whatsapp_clicks integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de imagens dos serviços
CREATE TABLE IF NOT EXISTS service_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela de visualizações
CREATE TABLE IF NOT EXISTS service_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  viewed_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_views ENABLE ROW LEVEL SECURITY;

-- Políticas RLS

-- Profiles
CREATE POLICY "Perfis públicos são visíveis para todos"
  ON profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Usuários podem editar próprio perfil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Services
CREATE POLICY "Serviços ativos são visíveis para todos"
  ON services FOR SELECT
  TO public
  USING (status = 'active');

CREATE POLICY "Prestadores podem gerenciar próprios serviços"
  ON services FOR ALL
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Service Images
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

-- Categories
CREATE POLICY "Categorias são visíveis para todos"
  ON categories FOR SELECT
  TO public
  USING (true);

-- Service Views
CREATE POLICY "Visualizações podem ser inseridas por qualquer um"
  ON service_views FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Prestadores podem ver estatísticas dos próprios serviços"
  ON service_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = service_views.service_id
      AND services.profile_id = auth.uid()
    )
  );

-- Inserir categorias iniciais
INSERT INTO categories (name, slug) VALUES
  ('Construção Civil', 'construcao-civil'),
  ('Limpeza', 'limpeza'),
  ('Jardinagem', 'jardinagem'),
  ('Elétrica', 'eletrica'),
  ('Hidráulica', 'hidraulica'),
  ('Pintura', 'pintura'),
  ('Marcenaria', 'marcenaria'),
  ('Ar Condicionado', 'ar-condicionado'),
  ('Reformas', 'reformas'),
  ('Outros', 'outros')
ON CONFLICT (name) DO NOTHING;