/*
  # Adicionar suporte para hierarquia de categorias

  1. Alterações
    - Criar tabela categories se não existir
    - Adicionar coluna parent_id para criar hierarquia
    - Adicionar índice para melhorar performance
    - Adicionar constraint para evitar auto-referência
*/

-- Criar tabela categories se não existir
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Adicionar coluna parent_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' 
    AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE categories
    ADD COLUMN parent_id uuid REFERENCES categories(id);
  END IF;
END $$;

-- Criar índice se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'categories_parent_id_idx'
  ) THEN
    CREATE INDEX categories_parent_id_idx ON categories(parent_id);
  END IF;
END $$;

-- Adicionar constraint se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'categories_no_self_reference'
  ) THEN
    ALTER TABLE categories
    ADD CONSTRAINT categories_no_self_reference 
    CHECK (id != parent_id);
  END IF;
END $$;