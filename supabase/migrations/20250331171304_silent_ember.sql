/*
  # Atualização das políticas de segurança

  1. Alterações
    - Remover restrições de RLS para todas as tabelas
    - Permitir acesso público para todas as operações
*/

DO $$ 
BEGIN
  -- Desabilitar RLS em todas as tabelas (se existirem)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles') THEN
    ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Perfis públicos são visíveis para todos" ON profiles;
    DROP POLICY IF EXISTS "Usuários podem editar próprio perfil" ON profiles;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'services') THEN
    ALTER TABLE services DISABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Serviços ativos são visíveis para todos" ON services;
    DROP POLICY IF EXISTS "Prestadores podem gerenciar próprios serviços" ON services;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'service_images') THEN
    ALTER TABLE service_images DISABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Imagens de serviços ativos são visíveis para todos" ON service_images;
    DROP POLICY IF EXISTS "Prestadores podem gerenciar imagens dos próprios serviços" ON service_images;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'service_views') THEN
    ALTER TABLE service_views DISABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Visualizações podem ser inseridas por qualquer um" ON service_views;
    DROP POLICY IF EXISTS "Prestadores podem ver estatísticas dos próprios serviços" ON service_views;
  END IF;
END $$;