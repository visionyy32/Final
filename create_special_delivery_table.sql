-- Create special_delivery_orders table for express delivery, cold chain, and international shipping
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.special_delivery_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('express_delivery', 'cold_chain', 'international_shipping')),
  sender_name TEXT NOT NULL,
  sender_address TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  sender_email TEXT, -- For guest users to receive updates
  recipient_name TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  pickup_date DATE NOT NULL,
  preferred_time TEXT,
  
  -- Product details
  product_description TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('electronics', 'documents', 'clothing', 'foodstuff', 'fragile', 'pharmaceuticals', 'other')),
  fragility_level TEXT DEFAULT 'normal' CHECK (fragility_level IN ('normal', 'fragile', 'very_fragile')),
  weight_kg DECIMAL(8,2) NOT NULL,
  dimensions TEXT, -- JSON string: {"length": 10, "width": 20, "height": 5}
  
  -- Special requirements
  temperature_controlled BOOLEAN DEFAULT FALSE,
  temperature_range TEXT, -- e.g., "2-8°C" for cold chain
  special_instructions TEXT,
  
  -- Pricing and distance
  distance_km DECIMAL(8,2) NOT NULL,
  base_rate_per_km DECIMAL(6,2) DEFAULT 45.00,
  fragility_multiplier DECIMAL(3,2) DEFAULT 1.0,
  weight_multiplier DECIMAL(3,2) DEFAULT 1.0,
  service_multiplier DECIMAL(3,2) DEFAULT 1.0,
  total_cost DECIMAL(10,2) NOT NULL,
  
  -- Status and tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  tracking_number TEXT,
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  actual_pickup TIMESTAMP WITH TIME ZONE,
  actual_delivery TIMESTAMP WITH TIME ZONE,
  
  -- Admin fields
  assigned_driver TEXT,
  internal_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.special_delivery_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own special delivery orders" ON public.special_delivery_orders;
DROP POLICY IF EXISTS "Anyone can view orders by order number" ON public.special_delivery_orders;
DROP POLICY IF EXISTS "Users can insert own special delivery orders" ON public.special_delivery_orders;
DROP POLICY IF EXISTS "Users can update own special delivery orders" ON public.special_delivery_orders;
DROP POLICY IF EXISTS "Admins can view all special delivery orders" ON public.special_delivery_orders;
DROP POLICY IF EXISTS "Admins can update all special delivery orders" ON public.special_delivery_orders;

-- Create RLS Policies

-- Users can view their own special delivery orders (and guests can view by other means)
CREATE POLICY "Users can view own special delivery orders" ON public.special_delivery_orders
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow viewing orders by order number (for guest users and tracking)
CREATE POLICY "Anyone can view orders by order number" ON public.special_delivery_orders
  FOR SELECT USING (true);

-- Users can insert their own special delivery orders (includes guest users with NULL user_id)
CREATE POLICY "Users can insert own special delivery orders" ON public.special_delivery_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own special delivery orders
CREATE POLICY "Users can update own special delivery orders" ON public.special_delivery_orders
  FOR UPDATE USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Admins can view all special delivery orders
CREATE POLICY "Admins can view all special delivery orders" ON public.special_delivery_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Admins can update all special delivery orders
CREATE POLICY "Admins can update all special delivery orders" ON public.special_delivery_orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_special_delivery_orders_user_id ON public.special_delivery_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_special_delivery_orders_order_number ON public.special_delivery_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_special_delivery_orders_service_type ON public.special_delivery_orders(service_type);
CREATE INDEX IF NOT EXISTS idx_special_delivery_orders_status ON public.special_delivery_orders(status);
CREATE INDEX IF NOT EXISTS idx_special_delivery_orders_created_at ON public.special_delivery_orders(created_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_special_delivery_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_special_delivery_orders_updated_at ON public.special_delivery_orders;
CREATE TRIGGER update_special_delivery_orders_updated_at
  BEFORE UPDATE ON public.special_delivery_orders
  FOR EACH ROW EXECUTE FUNCTION update_special_delivery_orders_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.special_delivery_orders TO authenticated;
GRANT ALL ON public.special_delivery_orders TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
