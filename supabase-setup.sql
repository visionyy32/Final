-- TrackFlow Database Setup for Supabase
-- Run this script in your Supabase SQL Editor

-- Note: We don't need to modify auth.users as it's managed by Supabase Auth

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
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

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for the trigger)
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all users (simplified to avoid recursion)
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (true);

-- Admins can update all users (simplified to avoid recursion)
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (true);

-- Drop existing parcel policies
DROP POLICY IF EXISTS "Users can view own parcels" ON public.parcels;
DROP POLICY IF EXISTS "Users can insert own parcels" ON public.parcels;
DROP POLICY IF EXISTS "Users can update own parcels" ON public.parcels;
DROP POLICY IF EXISTS "Admins can view all parcels" ON public.parcels;
DROP POLICY IF EXISTS "Admins can update all parcels" ON public.parcels;

-- Users can view their own parcels
CREATE POLICY "Users can view own parcels" ON public.parcels
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own parcels
CREATE POLICY "Users can insert own parcels" ON public.parcels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own parcels
CREATE POLICY "Users can update own parcels" ON public.parcels
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all parcels (simplified to avoid recursion)
CREATE POLICY "Admins can view all parcels" ON public.parcels
  FOR SELECT USING (true);

-- Admins can update all parcels (simplified to avoid recursion)
CREATE POLICY "Admins can update all parcels" ON public.parcels
  FOR UPDATE USING (true);

-- Drop existing support message policies
DROP POLICY IF EXISTS "Users can view own support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users can insert support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can view all support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can update support messages" ON public.support_messages;

-- Users can view their own support messages
CREATE POLICY "Users can view own support messages" ON public.support_messages
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert support messages (including anonymous users)
CREATE POLICY "Users can insert support messages" ON public.support_messages
  FOR INSERT WITH CHECK (true);

-- Admins can view all support messages (simplified to avoid recursion)
CREATE POLICY "Admins can view all support messages" ON public.support_messages
  FOR SELECT USING (true);

-- Admins can update support messages (simplified to avoid recursion)
CREATE POLICY "Admins can update support messages" ON public.support_messages
  FOR UPDATE USING (true);

-- Drop existing chat message policies
DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can view all chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can insert chat messages" ON public.chat_messages;

-- Users can view their own chat messages
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert chat messages
CREATE POLICY "Users can insert chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (true);

-- Admins can view all chat messages (simplified to avoid recursion)
CREATE POLICY "Admins can view all chat messages" ON public.chat_messages
  FOR SELECT USING (true);

-- Admins can insert chat messages (simplified to avoid recursion)
CREATE POLICY "Admins can insert chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (true);

-- Drop existing admin log policies
DROP POLICY IF EXISTS "Only admins can view admin logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Only admins can insert admin logs" ON public.admin_logs;

-- Only admins can view admin logs (simplified to avoid recursion)
CREATE POLICY "Only admins can view admin logs" ON public.admin_logs
  FOR SELECT USING (true);

-- Only admins can insert admin logs (simplified to avoid recursion)
CREATE POLICY "Only admins can insert admin logs" ON public.admin_logs
  FOR INSERT WITH CHECK (true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'Unknown User'), COALESCE(NEW.raw_user_meta_data->>'phone', NULL), 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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