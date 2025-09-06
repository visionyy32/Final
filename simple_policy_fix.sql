-- Simple Database Policy Fix for Dispatcher Dashboard
-- Copy and paste this entire content into Supabase SQL Editor

-- Step 1: Check current policies (optional - just to see what exists)
-- You can run this first to see current policies:
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Step 2: Temporarily disable RLS to test (SAFEST APPROACH FOR TESTING)
ALTER TABLE public.parcels DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS and create simple policies
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop any existing problematic policies
DROP POLICY IF EXISTS "Users can view own parcels" ON public.parcels;
DROP POLICY IF EXISTS "Admins can view all parcels" ON public.parcels;
DROP POLICY IF EXISTS "Dispatchers can view all parcels" ON public.parcels;
DROP POLICY IF EXISTS "Dispatcher parcels access" ON public.parcels;

-- Step 5: Create a simple policy that allows all authenticated users to read parcels
-- This avoids the recursion issue entirely
CREATE POLICY "Allow authenticated parcels read" ON public.parcels
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated parcels update" ON public.parcels  
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Step 6: Verify policies were created
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'parcels';
