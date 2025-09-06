-- Add dispatcher role to the existing users table
-- Run this script in your Supabase SQL Editor to update the role constraint

-- First, drop the existing constraint
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new constraint with dispatcher role
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'dispatcher'));

-- Create a sample dispatcher user (optional)
-- UPDATE public.users 
-- SET role = 'dispatcher' 
-- WHERE email = 'dispatcher@example.com';

-- Create RLS policies for dispatcher role

-- Drop existing dispatcher-related policies if they exist
DROP POLICY IF EXISTS "Dispatchers can view all parcels" ON public.parcels;
DROP POLICY IF EXISTS "Dispatchers can update parcel status" ON public.parcels;
DROP POLICY IF EXISTS "Dispatchers can view all users" ON public.users;

-- Dispatchers can view all parcels (like admins)
CREATE POLICY "Dispatchers can view all parcels" ON public.parcels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'dispatcher'
    )
  );

-- Dispatchers can update parcel status and tracking info
CREATE POLICY "Dispatchers can update parcel status" ON public.parcels
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'dispatcher'
    )
  );

-- Dispatchers can view all users (for assigning parcels)
CREATE POLICY "Dispatchers can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'dispatcher'
    )
  );

-- Update the handle_new_user function to support dispatcher role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'Unknown User'), 
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL), 
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
