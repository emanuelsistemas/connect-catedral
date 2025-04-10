/*
  # Add WhatsApp field to service ratings
  
  1. Changes
    - Add whatsapp column for negative ratings
    - Column will store phone number for service provider contact
*/

-- Add whatsapp column to service_ratings
ALTER TABLE service_ratings
ADD COLUMN IF NOT EXISTS whatsapp text;