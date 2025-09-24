# 🚨 URGENT DATABASE FIX REQUIRED

## Issue
M-Pesa payments are failing because the `total_cost` column is missing from the parcels table.

## Error Message
```
column parcels.total_cost does not exist
```

## Fix Required
You need to run the `add_payment_fields.sql` migration in your Supabase dashboard.

## Steps to Fix:

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Migration**
   - Copy the contents of `add_payment_fields.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute the migration

3. **Verify the Fix**
   - The migration will add the missing `total_cost` column to all parcel tables
   - This will allow payments to work properly

## What the Migration Does:
- Adds `total_cost` column to parcels table
- Adds `total_cost` column to cold_chain_bookings table  
- Adds `total_cost` column to international_shipping table
- Adds `total_cost` column to special_delivery table
- Adds all payment-related columns (payment_method, payment_status, etc.)
- Creates payment_transactions audit table

## After Running Migration:
- Restart your backend server
- Try the payment again
- It should work without the "column does not exist" error

## Priority: HIGH
This must be done before payments can work properly.
