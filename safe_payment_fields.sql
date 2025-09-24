-- Safe M-Pesa payment fields migration
-- This version checks for table existence before altering

-- Add M-Pesa payment fields to parcels table (this should exist)
ALTER TABLE public.parcels ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.parcels ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pay_on_delivery';
ALTER TABLE public.parcels ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.parcels ADD COLUMN IF NOT EXISTS mpesa_checkout_id TEXT;
ALTER TABLE public.parcels ADD COLUMN IF NOT EXISTS mpesa_transaction_id TEXT;
ALTER TABLE public.parcels ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- Create cold_chain_bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cold_chain_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_number TEXT UNIQUE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  sender_email TEXT,
  sender_address TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_email TEXT,
  recipient_address TEXT NOT NULL,
  parcel_type TEXT NOT NULL,
  weight DECIMAL(10,2),
  dimensions TEXT,
  temperature_requirement TEXT,
  special_instructions TEXT,
  status TEXT DEFAULT 'Pending Pickup',
  date_created TIMESTAMP DEFAULT NOW(),
  estimated_delivery DATE,
  actual_delivery TIMESTAMP,
  user_id UUID REFERENCES public.users(id),
  total_cost DECIMAL(10,2) DEFAULT 0,
  payment_method TEXT DEFAULT 'pay_on_delivery',
  payment_status TEXT DEFAULT 'pending',
  mpesa_checkout_id TEXT,
  mpesa_transaction_id TEXT,
  paid_at TIMESTAMP
);

-- Add payment fields to cold_chain_bookings if table exists but columns don't
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cold_chain_bookings') THEN
    ALTER TABLE public.cold_chain_bookings ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE public.cold_chain_bookings ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pay_on_delivery';
    ALTER TABLE public.cold_chain_bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
    ALTER TABLE public.cold_chain_bookings ADD COLUMN IF NOT EXISTS mpesa_checkout_id TEXT;
    ALTER TABLE public.cold_chain_bookings ADD COLUMN IF NOT EXISTS mpesa_transaction_id TEXT;
    ALTER TABLE public.cold_chain_bookings ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
  END IF;
END $$;

-- Create international_shipping table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.international_shipping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_number TEXT UNIQUE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  sender_email TEXT,
  sender_address TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_email TEXT,
  recipient_address TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  parcel_type TEXT NOT NULL,
  weight DECIMAL(10,2),
  dimensions TEXT,
  customs_value DECIMAL(10,2),
  customs_description TEXT,
  shipping_method TEXT,
  status TEXT DEFAULT 'Pending Pickup',
  date_created TIMESTAMP DEFAULT NOW(),
  estimated_delivery DATE,
  actual_delivery TIMESTAMP,
  user_id UUID REFERENCES public.users(id),
  total_cost DECIMAL(10,2) DEFAULT 0,
  payment_method TEXT DEFAULT 'pay_on_delivery',
  payment_status TEXT DEFAULT 'pending',
  mpesa_checkout_id TEXT,
  mpesa_transaction_id TEXT,
  paid_at TIMESTAMP
);

-- Add payment fields to international_shipping if table exists but columns don't
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'international_shipping') THEN
    ALTER TABLE public.international_shipping ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE public.international_shipping ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pay_on_delivery';
    ALTER TABLE public.international_shipping ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
    ALTER TABLE public.international_shipping ADD COLUMN IF NOT EXISTS mpesa_checkout_id TEXT;
    ALTER TABLE public.international_shipping ADD COLUMN IF NOT EXISTS mpesa_transaction_id TEXT;
    ALTER TABLE public.international_shipping ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
  END IF;
END $$;

-- Create special_delivery table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.special_delivery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_number TEXT UNIQUE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  sender_email TEXT,
  sender_address TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_email TEXT,
  recipient_address TEXT NOT NULL,
  parcel_type TEXT NOT NULL,
  weight DECIMAL(10,2),
  dimensions TEXT,
  special_requirements TEXT,
  delivery_instructions TEXT,
  priority_level TEXT,
  status TEXT DEFAULT 'Pending Pickup',
  date_created TIMESTAMP DEFAULT NOW(),
  estimated_delivery DATE,
  actual_delivery TIMESTAMP,
  user_id UUID REFERENCES public.users(id),
  total_cost DECIMAL(10,2) DEFAULT 0,
  payment_method TEXT DEFAULT 'pay_on_delivery',
  payment_status TEXT DEFAULT 'pending',
  mpesa_checkout_id TEXT,
  mpesa_transaction_id TEXT,
  paid_at TIMESTAMP
);

-- Add payment fields to special_delivery if table exists but columns don't
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'special_delivery') THEN
    ALTER TABLE public.special_delivery ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE public.special_delivery ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pay_on_delivery';
    ALTER TABLE public.special_delivery ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
    ALTER TABLE public.special_delivery ADD COLUMN IF NOT EXISTS mpesa_checkout_id TEXT;
    ALTER TABLE public.special_delivery ADD COLUMN IF NOT EXISTS mpesa_transaction_id TEXT;
    ALTER TABLE public.special_delivery ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
  END IF;
END $$;

-- Create payments audit table for tracking all payment transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parcel_id UUID,
  parcel_type TEXT, -- 'regular', 'cold_chain', 'international', 'special'
  customer_phone TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  mpesa_checkout_id TEXT UNIQUE,
  mpesa_transaction_id TEXT,
  merchant_request_id TEXT,
  checkout_request_id TEXT,
  result_code TEXT,
  result_desc TEXT,
  transaction_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
  initiated_by TEXT, -- 'customer' or 'dispatcher'
  initiated_by_user_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  CONSTRAINT fk_initiated_user FOREIGN KEY (initiated_by_user_id) REFERENCES public.users(id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_checkout_id ON public.payment_transactions(mpesa_checkout_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON public.payment_transactions(mpesa_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(transaction_status);

-- Add indexes for tracking numbers on new tables
CREATE INDEX IF NOT EXISTS idx_cold_chain_tracking ON public.cold_chain_bookings(tracking_number);
CREATE INDEX IF NOT EXISTS idx_international_tracking ON public.international_shipping(tracking_number);
CREATE INDEX IF NOT EXISTS idx_special_delivery_tracking ON public.special_delivery(tracking_number);
