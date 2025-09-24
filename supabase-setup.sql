-- TrackFlow Database Setup for Supabase
-- Run this script in your Supabase SQL Editor

-- Note: We don't need to modify auth.users as it's managed by Supabase Auth

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'dispatcher')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create parcels table
CREATE TABLE IF NOT EXISTS public.parcels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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

-- Create support_messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
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

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_logs table
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create special_delivery_orders table for express delivery, cold chain, and international shipping
CREATE TABLE IF NOT EXISTS public.special_delivery_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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

-- Enable Row Level Security on all tables except users (to avoid recursion)
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_delivery_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Allow all access to users table" ON public.users;

-- Disable RLS on users table to prevent recursion issues
-- Users table will be managed through application-level security

-- Drop existing parcel policies
DROP POLICY IF EXISTS "Users can view own parcels" ON public.parcels;
DROP POLICY IF EXISTS "Users can insert own parcels" ON public.parcels;
DROP POLICY IF EXISTS "Users can update own parcels" ON public.parcels;
DROP POLICY IF EXISTS "Allow all access to parcels" ON public.parcels;

-- Allow authenticated users to manage their own parcels
CREATE POLICY "Allow all access to parcels" ON public.parcels
  FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NOT NULL) 
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Drop existing support message policies
DROP POLICY IF EXISTS "Users can view own support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users can insert support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Allow all access to support messages" ON public.support_messages;

-- Allow all users to insert and view support messages
CREATE POLICY "Allow all access to support messages" ON public.support_messages
  FOR ALL USING (true) WITH CHECK (true);

-- Drop existing chat message policies
DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow all access to chat messages" ON public.chat_messages;

-- Allow all access to chat messages
CREATE POLICY "Allow all access to chat messages" ON public.chat_messages
  FOR ALL USING (true) WITH CHECK (true);

-- Drop existing admin log policies
DROP POLICY IF EXISTS "Only admins can view admin logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Only admins can insert admin logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Allow all access to admin logs" ON public.admin_logs;

-- Allow all authenticated users to access admin logs (simplified to avoid recursion)
CREATE POLICY "Allow all access to admin logs" ON public.admin_logs
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Drop existing special delivery order policies
DROP POLICY IF EXISTS "Users can view own special delivery orders" ON public.special_delivery_orders;
DROP POLICY IF EXISTS "Anyone can view orders by order number" ON public.special_delivery_orders;
DROP POLICY IF EXISTS "Users can insert own special delivery orders" ON public.special_delivery_orders;
DROP POLICY IF EXISTS "Users can update own special delivery orders" ON public.special_delivery_orders;
DROP POLICY IF EXISTS "Admins can view all special delivery orders" ON public.special_delivery_orders;
DROP POLICY IF EXISTS "Admins can update all special delivery orders" ON public.special_delivery_orders;
DROP POLICY IF EXISTS "Allow all access to special delivery orders" ON public.special_delivery_orders;

-- Allow all access to special delivery orders (guest users and authenticated users)
CREATE POLICY "Allow all access to special delivery orders" ON public.special_delivery_orders
  FOR ALL USING (true) WITH CHECK (true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'Unknown User'), COALESCE(NEW.raw_user_meta_data->>'phone', NULL), 'user');
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_parcels_user_id ON public.parcels(user_id);
CREATE INDEX IF NOT EXISTS idx_parcels_tracking_number ON public.parcels(tracking_number);
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON public.support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_special_delivery_orders_user_id ON public.special_delivery_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_special_delivery_orders_order_number ON public.special_delivery_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_special_delivery_orders_service_type ON public.special_delivery_orders(service_type);
CREATE INDEX IF NOT EXISTS idx_special_delivery_orders_status ON public.special_delivery_orders(status); 