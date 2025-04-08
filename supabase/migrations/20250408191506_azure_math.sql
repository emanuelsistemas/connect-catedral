/*
  # Desabilitar RLS em todas as tabelas
  
  1. Alterações
    - Desabilitar RLS em todas as tabelas
    - Remover todas as políticas existentes
    
  2. Segurança
    - Acesso público a todas as tabelas
    - Sem restrições de segurança por linha
*/

-- Desabilitar RLS em todas as tabelas
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS main_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sub_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS services DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS service_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS service_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS service_status_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS company_departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS job_listings DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Perfis públicos são visíveis para todos" ON profiles;
DROP POLICY IF EXISTS "Usuários podem editar próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Serviços ativos são visíveis para todos" ON services;
DROP POLICY IF EXISTS "Prestadores podem gerenciar próprios serviços" ON services;
DROP POLICY IF EXISTS "Imagens de serviços ativos são visíveis para todos" ON service_images;
DROP POLICY IF EXISTS "Prestadores podem gerenciar imagens dos próprios serviços" ON service_images;
DROP POLICY IF EXISTS "Allow public read access to main categories" ON main_categories;
DROP POLICY IF EXISTS "Allow public read access to sub categories" ON sub_categories;
DROP POLICY IF EXISTS "Public can create service views" ON service_views;
DROP POLICY IF EXISTS "Service owners can view their service views" ON service_views;
DROP POLICY IF EXISTS "Service owners can view their service status history" ON service_status_history;
DROP POLICY IF EXISTS "Allow public read access to departments" ON company_departments;
DROP POLICY IF EXISTS "Active job listings are visible to everyone" ON job_listings;
DROP POLICY IF EXISTS "Service providers can manage their job listings" ON job_listings;
DROP POLICY IF EXISTS "Admins can manage main categories" ON main_categories;
DROP POLICY IF EXISTS "Admins can manage sub categories" ON sub_categories;