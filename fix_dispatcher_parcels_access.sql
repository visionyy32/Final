-- Fix Dispatcher Access to Parcels
-- This script ensures dispatchers can see all parcels in the dashboard
-- Run this in your Supabase SQL Editor

-- CRITICAL FIX: Update status check constraint to allow dispatcher status values
-- Drop the existing check constraint
ALTER TABLE public.parcels DROP CONSTRAINT IF EXISTS parcels_status_check;

-- Add new constraint with all allowed status values
ALTER TABLE public.parcels ADD CONSTRAINT parcels_status_check 
CHECK (status IN (
  'Pending Pickup', 'In Transit', 'Delivered', 'Cancelled',  -- Original values
  'pending', 'picked_up', 'in_transit', 'delivered', 'failed'  -- Dispatcher values
));

-- OPTION 1: Completely disable RLS on parcels table (Recommended for admin/dispatcher access)
ALTER TABLE public.parcels DISABLE ROW LEVEL SECURITY;

-- OPTION 2: If you prefer to keep RLS enabled, create permissive policies
-- Uncomment the lines below if you want to use policies instead of disabling RLS

-- ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;

-- -- Drop any existing restrictive policies
-- DROP POLICY IF EXISTS "Users can access own parcels" ON public.parcels;
-- DROP POLICY IF EXISTS "Users can view own parcels" ON public.parcels;
-- DROP POLICY IF EXISTS "Users can insert own parcels" ON public.parcels;
-- DROP POLICY IF EXISTS "Users can update own parcels" ON public.parcels;

-- -- Create permissive policy for authenticated users (including dispatchers)
-- CREATE POLICY "Allow all authenticated access to parcels" ON public.parcels
--   FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Also ensure users table is accessible for dispatcher dashboard
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Fix any other tables that dispatchers need access to
ALTER TABLE public.quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.express_delivery DISABLE ROW LEVEL SECURITY;

-- Ensure payment_transactions table is accessible
ALTER TABLE public.payment_transactions DISABLE ROW LEVEL SECURITY;

-- Add helpful indexes for better performance
CREATE INDEX IF NOT EXISTS idx_parcels_status ON public.parcels(status);
CREATE INDEX IF NOT EXISTS idx_parcels_created_at ON public.parcels(created_at);
CREATE INDEX IF NOT EXISTS idx_parcels_user_id ON public.parcels(user_id);

-- Add comment to document the change
COMMENT ON TABLE public.parcels IS 'Parcel tracking table - RLS disabled for dispatcher dashboard access';
COMMENT ON TABLE public.users IS 'User profiles - RLS disabled for admin/dispatcher access';

-- Verify the changes by showing table policies
SELECT 
    tablename,
    rowsecurity,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t 
WHERE schemaname = 'public' 
AND tablename IN ('parcels', 'users', 'quotes', 'express_delivery', 'payment_transactions');