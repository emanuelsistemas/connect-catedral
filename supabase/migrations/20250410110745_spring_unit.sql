-- Create whatsapp_clicks table
CREATE TABLE IF NOT EXISTS whatsapp_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  ip_address text NOT NULL,
  user_agent text,
  clicked_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_clicks_service_id 
ON whatsapp_clicks(service_id);

-- Create index for IP address lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_clicks_ip_address 
ON whatsapp_clicks(ip_address);

-- Disable RLS
ALTER TABLE whatsapp_clicks DISABLE ROW LEVEL SECURITY;