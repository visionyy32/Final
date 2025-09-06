-- Fix Dispatcher Dashboard Database Policies
-- Run this in your Supabase SQL Editor to fix the infinite recursion issue

-- Add dispatcher policies for parcels table
DROP POLICY IF EXISTS "Dispatchers can view all parcels" ON public.parcels;
DROP POLICY IF EXISTS "Dispatchers can update all parcels" ON public.parcels;

-- Dispatchers can view all parcels (needed for dispatcher dashboard)
CREATE POLICY "Dispatchers can view all parcels" ON public.parcels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'dispatcher'
    )
  );

-- Dispatchers can update parcel status and location
CREATE POLICY "Dispatchers can update all parcels" ON public.parcels
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'dispatcher'
    )
  );

-- Optional: Add dispatcher policy for viewing user info (if needed for parcel assignments)
DROP POLICY IF EXISTS "Dispatchers can view user info" ON public.users;
CREATE POLICY "Dispatchers can view user info" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() 
      AND u.role = 'dispatcher'
    )
  );

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'parcels')
ORDER BY tablename, policyname;
