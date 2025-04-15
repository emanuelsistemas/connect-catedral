/*
  # Add registrations table
  
  1. Changes
    - Create unprotected registrations table
    - Add necessary fields for user registration
    - Disable RLS for public access
*/

-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL,
  document text NOT NULL,
  company_name text,
  trading_name text,
  email text NOT NULL,
  whatsapp text NOT NULL,
  segment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Disable RLS
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;

-- Create index for document
CREATE INDEX IF NOT EXISTS idx_registrations_document 
ON registrations(document);