-- Simple Policy Fix for Admin Dashboard Users Access
-- This script fixes RLS policies to allow admin access to users table
-- Run this in your Supabase SQL Editor

-- Fix Users Table Access for Admin Dashboard
-- Drop any existing restrictive policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Allow all access to users table" ON public.users;
DROP POLICY IF EXISTS "Admin access to users" ON public.users;
DROP POLICY IF EXISTS "Users can access own data" ON public.users;

-- Option 1: Disable RLS completely on users table (Recommended for admin access)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Option 2: Alternative - Create permissive policy for authenticated users
-- Uncomment the lines below if you prefer to keep RLS enabled but allow broader access
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow authenticated access to users" ON public.users
--   FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure supporting functions exist for user management
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on users table if it doesn't exist
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure proper indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Add comment to document the fix
COMMENT ON TABLE public.users IS 'User profiles extending auth.users - RLS disabled for admin dashboard access';

-- Also fix parcels table policies for better admin access
-- Step 1: Temporarily disable RLS to test (SAFEST APPROACH FOR TESTING)
ALTER TABLE public.parcels DISABLE ROW LEVEL SECURITY;

-- Step 2: Re-enable RLS and create simple policies
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop any existing problematic policies
DROP POLICY IF EXISTS "Users can view own parcels" ON public.parcels;
DROP POLICY IF EXISTS "Admins can view all parcels" ON public.parcels;
DROP POLICY IF EXISTS "Dispatchers can view all parcels" ON public.parcels;
DROP POLICY IF EXISTS "Dispatcher parcels access" ON public.parcels;

-- Step 4: Create a simple policy that allows all authenticated users to read parcels
-- This avoids the recursion issue entirely
CREATE POLICY "Allow authenticated parcels read" ON public.parcels
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated parcels update" ON public.parcels  
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Step 5: Verify policies were created
SELECT 
  'users' as table_name,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users'
UNION ALL
SELECT 
  'parcels' as table_name,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'parcels';
