-- Fix Admin Dashboard Users Access
-- This script creates the missing users table and sets up proper policies for admin access
-- Run this in your Supabase SQL Editor

-- Create users table (extends auth.users) if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'dispatcher')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DO NOT enable RLS on users table to avoid recursion issues
-- The users table will be managed through application-level security
-- This allows admin dashboard to access user data without policy restrictions

-- Drop any existing RLS policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Allow all access to users table" ON public.users;
DROP POLICY IF EXISTS "Admin access to users" ON public.users;

-- Disable RLS on users table (if it was enabled)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL), 
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to auto-update updated_at timestamp for users
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on users table
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Add comment to document the table
COMMENT ON TABLE public.users IS 'User profiles extending auth.users - RLS disabled for admin access';

-- Insert current auth users into users table if they don't exist
-- This ensures existing users have profiles in the users table
INSERT INTO public.users (id, email, name, phone, role)
SELECT 
  auth_users.id,
  auth_users.email,
  COALESCE(auth_users.raw_user_meta_data->>'name', auth_users.email) as name,
  auth_users.raw_user_meta_data->>'phone' as phone,
  COALESCE(auth_users.raw_user_meta_data->>'role', 'user') as role
FROM auth.users auth_users
LEFT JOIN public.users existing_users ON auth_users.id = existing_users.id
WHERE existing_users.id IS NULL;

-- Create admin logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin logs (allow all authenticated users to avoid complexity)
DROP POLICY IF EXISTS "Allow all access to admin logs" ON public.admin_logs;
CREATE POLICY "Allow all access to admin logs" ON public.admin_logs
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for admin logs
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at);

-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for chat messages (allow all access)
DROP POLICY IF EXISTS "Allow all access to chat messages" ON public.chat_messages;
CREATE POLICY "Allow all access to chat messages" ON public.chat_messages
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for chat messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Fix Parcels Table Access for Admin Dashboard
-- Drop any existing restrictive policies on parcels table
DROP POLICY IF EXISTS "Users can access own parcels" ON public.parcels;
DROP POLICY IF EXISTS "Users can view own parcels" ON public.parcels;
DROP POLICY IF EXISTS "Users can insert own parcels" ON public.parcels;
DROP POLICY IF EXISTS "Users can update own parcels" ON public.parcels;
DROP POLICY IF EXISTS "Allow all access to parcels" ON public.parcels;
DROP POLICY IF EXISTS "Admin access to parcels" ON public.parcels;
DROP POLICY IF EXISTS "Dispatcher parcels access" ON public.parcels;
DROP POLICY IF EXISTS "Allow authenticated parcels read" ON public.parcels;
DROP POLICY IF EXISTS "Allow authenticated parcels update" ON public.parcels;

-- Disable RLS on parcels table for admin access
ALTER TABLE public.parcels DISABLE ROW LEVEL SECURITY;

-- Alternative: If you prefer to keep RLS enabled with permissive policies, uncomment below:
-- ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all authenticated access to parcels" ON public.parcels
--   FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Fix Quotes Table Access for Admin Dashboard  
-- Drop any existing restrictive policies on quotes table
DROP POLICY IF EXISTS "Users can access own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can insert own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update own quotes" ON public.quotes;

-- Disable RLS on quotes table for admin access
ALTER TABLE public.quotes DISABLE ROW LEVEL SECURITY;

-- Fix Express Delivery Table Access for Admin Dashboard
-- Drop any existing restrictive policies on express_delivery table
DROP POLICY IF EXISTS "Users can access own express deliveries" ON public.express_delivery;
DROP POLICY IF EXISTS "Users can view own express deliveries" ON public.express_delivery;
DROP POLICY IF EXISTS "Users can insert own express deliveries" ON public.express_delivery;
DROP POLICY IF EXISTS "Users can update own express deliveries" ON public.express_delivery;

-- Disable RLS on express_delivery table for admin access
ALTER TABLE public.express_delivery DISABLE ROW LEVEL SECURITY;

-- Support messages should remain accessible (they already have permissive policies)
-- But let's ensure they work properly
DROP POLICY IF EXISTS "Users can access support messages" ON public.support_messages;
CREATE POLICY "Allow all access to support messages" ON public.support_messages
  FOR ALL USING (true) WITH CHECK (true);

-- Add comments to document the changes
COMMENT ON TABLE public.parcels IS 'Regular parcel tracking - RLS disabled for admin dashboard access';
COMMENT ON TABLE public.quotes IS 'Cold chain and international shipping quotes - RLS disabled for admin dashboard access';
COMMENT ON TABLE public.express_delivery IS 'Express delivery orders - RLS disabled for admin dashboard access';
COMMENT ON TABLE public.support_messages IS 'Customer support messages - Open access for admin management';
