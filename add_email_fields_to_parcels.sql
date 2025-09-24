-- Add missing fields to parcels table for complete data storage
-- Run this in your Supabase SQL Editor

-- Add email fields
ALTER TABLE public.parcels 
ADD COLUMN IF NOT EXISTS sender_email TEXT,
ADD COLUMN IF NOT EXISTS recipient_email TEXT;

-- Add payment-related fields
ALTER TABLE public.parcels 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pay_on_delivery' CHECK (payment_method IN ('pay_on_delivery', 'pay_now')),
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2);

-- Update existing records to populate sender_email from auth.users if available
UPDATE public.parcels 
SET sender_email = auth_users.email
FROM auth.users AS auth_users
WHERE parcels.user_id = auth_users.id 
AND parcels.sender_email IS NULL;

-- Update existing records to set default payment values
UPDATE public.parcels 
SET payment_method = 'pay_on_delivery'
WHERE payment_method IS NULL;

UPDATE public.parcels 
SET payment_status = 'pending'
WHERE payment_status IS NULL;

UPDATE public.parcels 
SET total_cost = cost
WHERE total_cost IS NULL AND cost IS NOT NULL;

-- Add comments to document the changes
COMMENT ON COLUMN public.parcels.sender_email IS 'Email address of the sender';
COMMENT ON COLUMN public.parcels.recipient_email IS 'Email address of the recipient (optional)';
COMMENT ON COLUMN public.parcels.payment_method IS 'Payment method chosen by user';
COMMENT ON COLUMN public.parcels.payment_status IS 'Current status of payment';
COMMENT ON COLUMN public.parcels.total_cost IS 'Total cost including all charges';
