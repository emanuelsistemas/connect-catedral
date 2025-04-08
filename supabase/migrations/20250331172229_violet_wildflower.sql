/*
  # Add RLS policies
  
  1. Changes
    - Enable RLS on all tables
    - Add policies for each table
*/

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE main_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_status_history ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Perfis públicos são visíveis para todos"
  ON profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Usuários podem editar próprio perfil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Services policies
CREATE POLICY "Serviços ativos são visíveis para todos"
  ON services FOR SELECT
  TO public
  USING (status = 'active');

CREATE POLICY "Prestadores podem gerenciar próprios serviços"
  ON services FOR ALL
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Service Images policies
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

-- Categories policies
CREATE POLICY "Allow public read access to main categories"
  ON main_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to sub categories"
  ON sub_categories FOR SELECT
  TO public
  USING (true);

-- Service Views policies
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

-- Service Status History policies
CREATE POLICY "Service owners can view their service status history"
  ON service_status_history FOR SELECT
  TO authenticated
  USING (
    service_id IN (
      SELECT id FROM services WHERE profile_id = auth.uid()
    )
  );