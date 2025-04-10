/*
  # Add service ratings and notifications
  
  1. Tables
    - service_ratings: Store user ratings and comments
    - service_rating_replies: Store provider replies to ratings
    - notifications: Store user notifications
    
  2. Functions & Triggers
    - Notification creation for new ratings and views
    - Proper error handling for existing objects
*/

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS create_rating_notification_trigger ON service_ratings;
DROP TRIGGER IF EXISTS create_view_notification_trigger ON service_views;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS create_rating_notification();
DROP FUNCTION IF EXISTS create_view_notification();

-- Create service_ratings table
CREATE TABLE IF NOT EXISTS service_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  rating boolean NOT NULL, -- true = thumbs up, false = thumbs down
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create service_rating_replies table
CREATE TABLE IF NOT EXISTS service_rating_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id uuid NOT NULL REFERENCES service_ratings(id) ON DELETE CASCADE,
  reply text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_service_ratings_service_id 
ON service_ratings(service_id);

CREATE INDEX IF NOT EXISTS idx_service_ratings_user_id 
ON service_ratings(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_read 
ON notifications(read);

-- Create function to create notification on new rating
CREATE FUNCTION create_rating_notification()
RETURNS TRIGGER AS $$
DECLARE
  service_owner_id uuid;
  service_title text;
BEGIN
  -- Get service owner and title
  SELECT profile_id, title INTO service_owner_id, service_title
  FROM services
  WHERE id = NEW.service_id;

  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    service_owner_id,
    'rating',
    'Nova Avaliação',
    CASE
      WHEN NEW.rating THEN 'Você recebeu uma avaliação positiva'
      ELSE 'Você recebeu uma avaliação negativa'
    END,
    jsonb_build_object(
      'service_id', NEW.service_id,
      'service_title', service_title,
      'rating_id', NEW.id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notifications
CREATE TRIGGER create_rating_notification_trigger
  AFTER INSERT ON service_ratings
  FOR EACH ROW
  EXECUTE FUNCTION create_rating_notification();

-- Create function to create notification on new service view
CREATE FUNCTION create_view_notification()
RETURNS TRIGGER AS $$
DECLARE
  service_owner_id uuid;
  service_title text;
BEGIN
  -- Get service owner and title
  SELECT profile_id, title INTO service_owner_id, service_title
  FROM services
  WHERE id = NEW.service_id;

  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    service_owner_id,
    'view',
    'Nova Visualização',
    'Seu serviço foi visualizado',
    jsonb_build_object(
      'service_id', NEW.service_id,
      'service_title', service_title
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for view notifications
CREATE TRIGGER create_view_notification_trigger
  AFTER INSERT ON service_views
  FOR EACH ROW
  EXECUTE FUNCTION create_view_notification();

-- Disable RLS
ALTER TABLE service_ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_rating_replies DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;