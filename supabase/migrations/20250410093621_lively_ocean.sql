/*
  # Update service ratings table
  
  1. Changes
    - Add reviewer_name column for non-authenticated users
    - Add ip_address column for tracking
    - Update existing functions and triggers
*/

-- Add new columns to service_ratings
ALTER TABLE service_ratings
ADD COLUMN IF NOT EXISTS reviewer_name text,
ADD COLUMN IF NOT EXISTS ip_address text;

-- Make user_id optional since we'll allow anonymous reviews
ALTER TABLE service_ratings 
ALTER COLUMN user_id DROP NOT NULL;