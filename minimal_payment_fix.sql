-- MINIMAL FIX: Only add payment fields to parcels table
-- Run this first to fix the immediate payment issue

-- Add M-Pesa payment fields to parcels table
ALTER TABLE public.parcels ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.parcels ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pay_on_delivery';
ALTER TABLE public.parcels ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.parcels ADD COLUMN IF NOT EXISTS mpesa_checkout_id TEXT;
ALTER TABLE public.parcels ADD COLUMN IF NOT EXISTS mpesa_transaction_id TEXT;
ALTER TABLE public.parcels ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- Create payments audit table for tracking all payment transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parcel_id UUID,
  parcel_type TEXT DEFAULT 'regular',
  customer_phone TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  mpesa_checkout_id TEXT UNIQUE,
  mpesa_transaction_id TEXT,
  merchant_request_id TEXT,
  checkout_request_id TEXT,
  result_code TEXT,
  result_desc TEXT,
  transaction_status TEXT DEFAULT 'pending',
  initiated_by TEXT,
  initiated_by_user_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_checkout_id ON public.payment_transactions(mpesa_checkout_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON public.payment_transactions(mpesa_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(transaction_status);
