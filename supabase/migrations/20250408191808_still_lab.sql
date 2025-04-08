/*
  # Corrigir estrutura das tabelas de categorias
  
  1. Alterações
    - Remover constraint UNIQUE do nome na tabela sub_categories
    - Adicionar índice composto para evitar duplicatas por categoria principal
    - Garantir que RLS está desabilitado
*/

-- Remover constraint UNIQUE do nome na tabela sub_categories
ALTER TABLE sub_categories 
DROP CONSTRAINT IF EXISTS sub_categories_name_key;

-- Criar índice composto para evitar duplicatas dentro da mesma categoria principal
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_subcategory_per_main 
ON sub_categories (main_category_id, name);

-- Garantir que RLS está desabilitado
ALTER TABLE main_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE sub_categories DISABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Allow public read access to main categories" ON main_categories;
DROP POLICY IF EXISTS "Allow public read access to sub categories" ON sub_categories;
DROP POLICY IF EXISTS "Admins can manage main categories" ON main_categories;
DROP POLICY IF EXISTS "Admins can manage sub categories" ON sub_categories;