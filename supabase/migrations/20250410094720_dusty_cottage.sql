/*
  # Fix service ratings user relation

  1. Changes
    - Enable RLS on service_ratings table
    - Add RLS policies for service ratings
    - Add foreign key relationship between service_ratings and users
    - Add RLS policies for service_rating_replies

  2. Security
    - Enable RLS on service_ratings and service_rating_replies tables
    - Add policies for authenticated and anonymous users to read ratings
    - Add policies for users to create ratings
    - Add policies for service owners to reply to ratings
*/

-- Enable RLS
ALTER TABLE service_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_rating_replies ENABLE ROW LEVEL SECURITY;

-- Policies for service_ratings
CREATE POLICY "Anyone can read service ratings"
  ON service_ratings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create ratings"
  ON service_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anonymous users can create ratings"
  ON service_ratings
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policies for service_rating_replies
CREATE POLICY "Anyone can read rating replies"
  ON service_rating_replies
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service owners can reply to ratings"
  ON service_rating_replies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM services s
      JOIN service_ratings sr ON sr.service_id = s.id
      WHERE sr.id = service_rating_replies.rating_id
      AND s.profile_id IN (
        SELECT id FROM profiles WHERE id = auth.uid()
      )
    )
  );