-- Add policy for updating rating replies
CREATE POLICY "Service owners can update their replies"
  ON service_rating_replies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services s
      JOIN service_ratings sr ON sr.service_id = s.id
      WHERE sr.id = service_rating_replies.rating_id
      AND s.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM services s
      JOIN service_ratings sr ON sr.service_id = s.id
      WHERE sr.id = service_rating_replies.rating_id
      AND s.profile_id = auth.uid()
    )
  );