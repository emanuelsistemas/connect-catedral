/*
  # Add Job Listings Feature

  1. New Tables
    - `company_departments` - List of company departments/sectors
    - `job_listings` - Job postings by service providers
    
  2. Security
    - Enable RLS
    - Add appropriate policies
*/

-- Create company_departments table
CREATE TABLE IF NOT EXISTS company_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create job_listings table
CREATE TABLE IF NOT EXISTS job_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id),
  title text NOT NULL,
  department_id uuid NOT NULL REFERENCES company_departments(id),
  description text NOT NULL,
  email text NOT NULL,
  whatsapp text,
  status service_status NOT NULL DEFAULT 'pending',
  views_count integer NOT NULL DEFAULT 0,
  whatsapp_clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_listings_profile_id ON job_listings(profile_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_department_id ON job_listings(department_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_status ON job_listings(status);
CREATE INDEX IF NOT EXISTS idx_job_listings_created_at ON job_listings(created_at);

-- Enable RLS
ALTER TABLE company_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow public read access to departments"
  ON company_departments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Active job listings are visible to everyone"
  ON job_listings FOR SELECT
  TO public
  USING (status = 'active');

CREATE POLICY "Service providers can manage their job listings"
  ON job_listings FOR ALL
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Insert departments
INSERT INTO company_departments (name) VALUES
  ('Administrativo'),
  ('Comercial'),
  ('Compras'),
  ('Contabilidade'),
  ('Financeiro'),
  ('Jurídico'),
  ('Logística'),
  ('Marketing'),
  ('Operacional'),
  ('Produção'),
  ('Qualidade'),
  ('Recursos Humanos'),
  ('Tecnologia da Informação'),
  ('Vendas'),
  ('Manutenção'),
  ('Facilities'),
  ('Customer Success'),
  ('Atendimento ao Cliente'),
  ('Desenvolvimento de Produtos'),
  ('Design'),
  ('Engenharia'),
  ('Pesquisa e Desenvolvimento'),
  ('Segurança do Trabalho'),
  ('Treinamento e Desenvolvimento')
ON CONFLICT (name) DO NOTHING;

-- Add trigger for updating timestamps
CREATE TRIGGER update_job_listings_updated_at
  BEFORE UPDATE ON job_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();