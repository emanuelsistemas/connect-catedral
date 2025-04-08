/*
  # Adicionar campo admin na tabela profiles

  1. Alterações
    - Adicionar coluna admin com valor padrão 'N'
    - Adicionar constraint para validar valores permitidos (N/S)
    - Atualizar função handle_new_user para incluir o novo campo
*/

-- Adicionar coluna admin se não existir
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS admin char(1) NOT NULL DEFAULT 'N';

-- Adicionar constraint para validar valores permitidos
ALTER TABLE profiles 
ADD CONSTRAINT valid_profile_admin CHECK (admin IN ('N', 'S'));

-- Atualizar função handle_new_user para incluir o novo campo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    company_name,
    phone,
    email,
    admin,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email,
    'N',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;