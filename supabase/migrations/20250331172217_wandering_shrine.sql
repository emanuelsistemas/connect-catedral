/*
  # Create tracking tables
  
  1. Changes
    - Create service_views table
    - Create service_status_history table
*/

-- Create service_views table
CREATE TABLE IF NOT EXISTS service_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id),
  ip_address text,
  user_agent text,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

-- Create service_status_history table
CREATE TABLE IF NOT EXISTS service_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  old_status service_status,
  new_status service_status NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  reason text
);