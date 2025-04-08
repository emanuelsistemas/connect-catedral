/*
  # Add triggers and functions
  
  1. Changes
    - Create trigger for updating timestamps
    - Create trigger for tracking service status changes
    - Create trigger for enforcing max images
*/

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

-- Create trigger for services
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to track status changes
CREATE OR REPLACE FUNCTION track_service_status_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO service_status_history (
      service_id,
      old_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ language plpgsql SECURITY DEFINER;

-- Create trigger for status tracking
DROP TRIGGER IF EXISTS track_service_status_changes ON services;
CREATE TRIGGER track_service_status_changes
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION track_service_status_changes();

-- Create function to enforce max images
CREATE OR REPLACE FUNCTION count_service_images()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM service_images WHERE service_id = NEW.service_id) > 6 THEN
    RAISE EXCEPTION 'Maximum of 6 images per service allowed';
  END IF;
  RETURN NEW;
END;
$$ language plpgsql;

-- Create trigger for max images
DROP TRIGGER IF EXISTS enforce_max_images ON service_images;
CREATE TRIGGER enforce_max_images
  BEFORE INSERT ON service_images
  FOR EACH ROW
  EXECUTE FUNCTION count_service_images();