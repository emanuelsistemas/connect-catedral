/*
  # Adicionar suporte para sites de portfólio nos serviços
  
  1. Alterações
    - Adicionar tabela portfolio_sites para armazenar URLs
    - Relacionamento com a tabela services
    - Limite de 5 sites por serviço
    
  2. Segurança
    - Manter RLS desabilitado conforme padrão atual
*/

-- Criar tabela para sites do portfólio
CREATE TABLE IF NOT EXISTS portfolio_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_portfolio_sites_service_id 
ON portfolio_sites(service_id);

-- Criar função para verificar limite de sites
CREATE OR REPLACE FUNCTION check_portfolio_sites_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM portfolio_sites
    WHERE service_id = NEW.service_id
  ) >= 5 THEN
    RAISE EXCEPTION 'Limite máximo de 5 sites por serviço';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para limitar quantidade de sites
CREATE TRIGGER enforce_portfolio_sites_limit
  BEFORE INSERT ON portfolio_sites
  FOR EACH ROW
  EXECUTE FUNCTION check_portfolio_sites_limit();

-- Desabilitar RLS
ALTER TABLE portfolio_sites DISABLE ROW LEVEL SECURITY;