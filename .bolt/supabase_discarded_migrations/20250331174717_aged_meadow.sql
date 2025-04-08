/*
  # Desabilitar RLS e remover políticas

  1. Alterações
    - Desabilitar RLS em todas as tabelas
    - Remover todas as políticas existentes
    - Remover políticas de storage
*/

-- Desabilitar RLS em todas as tabelas
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE main_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE sub_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_status_history DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas RLS
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

-- Remover políticas de storage
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Access" ON storage.objects;