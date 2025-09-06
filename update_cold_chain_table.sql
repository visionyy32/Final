-- Add new columns for enhanced cold chain logistics support
-- Run this in your Supabase SQL Editor to update the existing table

-- Add new columns for cold chain logistics
ALTER TABLE public.special_delivery_orders 
ADD COLUMN IF NOT EXISTS pickup_location TEXT,
ADD COLUMN IF NOT EXISTS delivery_location TEXT,
ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'standard' CHECK (urgency IN ('standard', 'urgent', 'emergency')),
ADD COLUMN IF NOT EXISTS base_rate_per_kg DECIMAL(8,2), -- For cold chain per-kg pricing
ADD COLUMN IF NOT EXISTS temperature_multiplier DECIMAL(3,2), -- Temperature adjustment multiplier
ADD COLUMN IF NOT EXISTS temperature_type TEXT CHECK (temperature_type IN ('pharmaceutical', 'perishable', 'refrigerated', 'frozen'));

-- Update product_type to include new cold chain shipment types
ALTER TABLE public.special_delivery_orders 
DROP CONSTRAINT IF EXISTS special_delivery_orders_product_type_check;

ALTER TABLE public.special_delivery_orders 
ADD CONSTRAINT special_delivery_orders_product_type_check 
CHECK (product_type IN (
  'electronics', 'documents', 'clothing', 'foodstuff', 'fragile', 'pharmaceuticals', 'other',
  'vaccines', 'blood_products', 'organs', 'fresh_food', 'frozen_food', 'dairy', 'chemicals'
));

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_special_delivery_orders_temperature_type ON public.special_delivery_orders(temperature_type);
CREATE INDEX IF NOT EXISTS idx_special_delivery_orders_urgency ON public.special_delivery_orders(urgency);

-- Add comment to table for documentation
COMMENT ON TABLE public.special_delivery_orders IS 'Special delivery orders including express delivery, cold chain logistics, and international shipping with enhanced cold chain support';
COMMENT ON COLUMN public.special_delivery_orders.temperature_type IS 'Type of temperature control: pharmaceutical (2-8°C, 60% increase), perishable (0-2°C, 60% increase), refrigerated (2-8°C, 40% increase), frozen (-18°C to -25°C, 50% increase)';
COMMENT ON COLUMN public.special_delivery_orders.base_rate_per_kg IS 'Base rate per kilogram for cold chain logistics (KSh 6000/kg)';
COMMENT ON COLUMN public.special_delivery_orders.temperature_multiplier IS 'Multiplier applied for temperature control requirements';
COMMENT ON COLUMN public.special_delivery_orders.urgency IS 'Urgency level for the delivery';
COMMENT ON COLUMN public.special_delivery_orders.pickup_location IS 'Detailed pickup location address';
COMMENT ON COLUMN public.special_delivery_orders.delivery_location IS 'Detailed delivery location address';
