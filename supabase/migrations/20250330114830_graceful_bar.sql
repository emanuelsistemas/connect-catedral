/*
  # Add is_featured column to service_images table

  1. Changes
    - Add `is_featured` boolean column to `service_images` table with default value false
    - Add constraint to ensure only one featured image per service
  
  2. Notes
    - The constraint ensures data integrity by preventing multiple featured images per service
*/

-- Add is_featured column
ALTER TABLE service_images
ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- Add constraint to ensure only one featured image per service
CREATE UNIQUE INDEX IF NOT EXISTS unique_featured_image_per_service 
ON service_images (service_id) 
WHERE is_featured = true;