-- Fresh TrackFlow Database Setup for Supabase
-- Run this script in your Supabase SQL Editor

-- Create parcels table for regular parcel tracking
CREATE TABLE IF NOT EXISTS public.parcels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_address TEXT NOT NULL,
  sender_county TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  sender_commuter TEXT,
  recipient_name TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  recipient_county TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  parcel_description TEXT NOT NULL,
  parcel_weight DECIMAL(5,2) NOT NULL,
  parcel_length DECIMAL(5,2),
  parcel_width DECIMAL(5,2),
  parcel_height DECIMAL(5,2),
  special_instructions TEXT,
  status TEXT DEFAULT 'Pending Pickup' CHECK (status IN ('Pending Pickup', 'In Transit', 'Delivered', 'Cancelled')),
  cost DECIMAL(10,2),
  estimated_delivery DATE,
  current_location TEXT,
  destination TEXT,
  last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quotes table for cold chain logistics and international shipping
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT UNIQUE NOT NULL DEFAULT 'QT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('cold_chain', 'international_shipping')),
  
  -- Contact Information
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  sender_address TEXT NOT NULL,
  sender_city TEXT NOT NULL,
  sender_country TEXT NOT NULL DEFAULT 'Kenya',
  
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  recipient_phone TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  recipient_city TEXT NOT NULL,
  recipient_country TEXT NOT NULL,
  
  -- Shipment Details
  package_description TEXT NOT NULL,
  package_type TEXT NOT NULL, -- Removed CHECK constraint to allow any package type
  weight_kg DECIMAL(8,2) NOT NULL,
  dimensions_length_cm DECIMAL(8,2),
  dimensions_width_cm DECIMAL(8,2),
  dimensions_height_cm DECIMAL(8,2),
  declared_value DECIMAL(12,2),
  
  -- Cold Chain Specific Fields
  temperature_requirement TEXT, -- e.g., "2-8°C", "-18°C", "15-25°C"
  temperature_sensitive BOOLEAN DEFAULT FALSE,
  
  -- International Shipping Specific Fields
  customs_declaration TEXT,
  hs_code TEXT, -- Harmonized System code for customs
  is_commercial BOOLEAN DEFAULT FALSE,
  
  -- Shipping Preferences
  pickup_date DATE NOT NULL,
  preferred_pickup_time TEXT,
  delivery_urgency TEXT DEFAULT 'standard' CHECK (delivery_urgency IN ('standard', 'express', 'urgent')),
  insurance_required BOOLEAN DEFAULT FALSE,
  special_handling_instructions TEXT,
  
  -- Quote Information
  estimated_cost DECIMAL(12,2),
  quote_valid_until DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'accepted', 'declined', 'expired', 'booked')),
  
  -- Admin Fields
  quoted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  quoted_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop the existing package_type constraint if it exists
ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS quotes_package_type_check;

-- Create express_delivery table for express delivery services
CREATE TABLE IF NOT EXISTS public.express_delivery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL DEFAULT 'EXP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contact Information
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  sender_phone TEXT NOT NULL,
  sender_address TEXT NOT NULL,
  sender_city TEXT NOT NULL,
  sender_country TEXT NOT NULL DEFAULT 'Kenya',
  
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  recipient_phone TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  recipient_city TEXT NOT NULL,
  recipient_country TEXT NOT NULL DEFAULT 'Kenya',
  
  -- Package Details
  package_description TEXT NOT NULL,
  package_type TEXT NOT NULL, -- electronics, documents, clothing, food, etc.
  package_category TEXT, -- fragile, non-fragile, liquid, etc.
  weight_kg DECIMAL(8,2) NOT NULL,
  dimensions_length_cm DECIMAL(8,2),
  dimensions_width_cm DECIMAL(8,2),
  dimensions_height_cm DECIMAL(8,2),
  declared_value DECIMAL(12,2),
  
  -- Delivery Preferences
  pickup_date DATE NOT NULL,
  preferred_pickup_time TEXT,
  delivery_urgency TEXT DEFAULT 'standard' CHECK (delivery_urgency IN ('standard', 'express', 'urgent', 'same_day')),
  delivery_time_preference TEXT, -- morning, afternoon, evening, anytime
  special_instructions TEXT,
  
  -- Service Options
  insurance_required BOOLEAN DEFAULT FALSE,
  signature_required BOOLEAN DEFAULT TRUE,
  fragile_handling BOOLEAN DEFAULT FALSE,
  express_type TEXT DEFAULT 'standard' CHECK (express_type IN ('standard', 'same_day', 'next_day', 'two_day')),
  
  -- Pricing Information
  distance_km DECIMAL(8,2),
  base_cost DECIMAL(12,2),
  express_surcharge DECIMAL(12,2),
  insurance_cost DECIMAL(12,2),
  total_cost DECIMAL(12,2) NOT NULL,
  
  -- Tracking and Status
  tracking_number TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'failed_delivery')),
  estimated_pickup TIMESTAMP WITH TIME ZONE,
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  actual_pickup TIMESTAMP WITH TIME ZONE,
  actual_delivery TIMESTAMP WITH TIME ZONE,
  current_location TEXT,
  
  -- Admin Fields
  assigned_driver TEXT,
  driver_phone TEXT,
  vehicle_info TEXT,
  internal_notes TEXT,
  confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create support_messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT DEFAULT 'Contact Us Form' CHECK (source IN ('Contact Us Form', 'FAQ Contact Form')),
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Resolved')),
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on tables (but not on users to avoid recursion)
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.express_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for parcels
DROP POLICY IF EXISTS "Users can access own parcels" ON public.parcels;
CREATE POLICY "Users can access own parcels" ON public.parcels
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create RLS Policies for quotes
DROP POLICY IF EXISTS "Users can access own quotes" ON public.quotes;
CREATE POLICY "Users can access own quotes" ON public.quotes
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create RLS Policies for express_delivery
DROP POLICY IF EXISTS "Users can access own express deliveries" ON public.express_delivery;
CREATE POLICY "Users can access own express deliveries" ON public.express_delivery
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create RLS Policies for support messages
DROP POLICY IF EXISTS "Users can access support messages" ON public.support_messages;
CREATE POLICY "Users can access support messages" ON public.support_messages
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_parcels_user_id ON public.parcels(user_id);
CREATE INDEX IF NOT EXISTS idx_parcels_tracking_number ON public.parcels(tracking_number);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON public.parcels(status);

CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON public.quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_service_type ON public.quotes(service_type);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_pickup_date ON public.quotes(pickup_date);

CREATE INDEX IF NOT EXISTS idx_express_delivery_user_id ON public.express_delivery(user_id);
CREATE INDEX IF NOT EXISTS idx_express_delivery_order_number ON public.express_delivery(order_number);
CREATE INDEX IF NOT EXISTS idx_express_delivery_tracking_number ON public.express_delivery(tracking_number);
CREATE INDEX IF NOT EXISTS idx_express_delivery_status ON public.express_delivery(status);
CREATE INDEX IF NOT EXISTS idx_express_delivery_pickup_date ON public.express_delivery(pickup_date);
CREATE INDEX IF NOT EXISTS idx_express_delivery_express_type ON public.express_delivery(express_type);

CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON public.support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_status ON public.support_messages(status);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_parcels_updated_at ON public.parcels;
CREATE TRIGGER update_parcels_updated_at
  BEFORE UPDATE ON public.parcels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_quotes_updated_at ON public.quotes;
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_express_delivery_updated_at ON public.express_delivery;
CREATE TRIGGER update_express_delivery_updated_at
  BEFORE UPDATE ON public.express_delivery
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_messages_updated_at ON public.support_messages;
CREATE TRIGGER update_support_messages_updated_at
  BEFORE UPDATE ON public.support_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
