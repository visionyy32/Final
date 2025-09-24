# M-Pesa Integration Setup Guide

## 🚀 **What's Been Implemented:**

### **Database Updates:**
- ✅ Added payment fields to all parcel tables (`payment_method`, `payment_status`, `mpesa_transaction_id`, etc.)
- ✅ Created `payment_transactions` table for audit trail
- ✅ SQL migration file: `add_payment_fields.sql`

### **Backend API:**
- ✅ M-Pesa STK Push integration (`/api/mpesa/stk-push`)
- ✅ Payment callback handler (`/api/mpesa/callback`)
- ✅ Payment status checker (`/api/mpesa/payment-status/:id`)
- ✅ Payment history endpoint (`/api/mpesa/payment-history/:parcelId/:type`)

### **Frontend Components:**
- ✅ `PaymentModal.jsx` - Handles M-Pesa payments with real-time status
- ✅ Enhanced `ParcelPlacementForm.jsx` - "Pay Now" vs "Pay on Delivery" options
- ✅ Enhanced `DispatcherDashboard.jsx` - "Collect Payment" buttons for dispatchers

## 🔧 **Setup Instructions:**

### **1. Database Setup:**
```sql
-- Run this in your Supabase SQL editor:
-- Copy and paste the contents of add_payment_fields.sql
```

### **2. Environment Variables:**
Create a `.env` file in your project root:
```bash
# M-Pesa Sandbox Configuration
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_ENV=sandbox
MPESA_CALLBACK_URL=http://localhost:3000/api/mpesa/callback

# Supabase (for server-side operations)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **3. Get M-Pesa Credentials:**
1. Go to [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
2. Create an account and new app
3. Get Consumer Key, Consumer Secret, and Passkey
4. Use shortcode `174379` for sandbox testing

### **4. Install Dependencies:**
```bash
npm install @supabase/supabase-js
```

### **5. Update package.json:**
Change `"type": "module"` to use CommonJS or update all imports/exports consistently.

## 🎯 **How It Works:**

### **Customer Payment Flow (Pay Now):**
1. Customer fills parcel form
2. Selects "Pay Now (M-Pesa)"
3. Enters phone number
4. Receives STK Push on phone
5. Enters M-Pesa PIN
6. Payment confirmed → Parcel status: "Paid - Ready for Pickup"

### **Dispatcher Payment Collection (Pay on Delivery):**
1. Parcel created with "Pay on Delivery"
2. Dispatcher delivers parcel
3. Clicks "Collect Payment" in dashboard
4. Customer receives STK Push
5. Customer pays → Parcel marked as "Delivered"

## 🧪 **Testing:**

### **1. Test Phone Numbers (Sandbox):**
- `254708374149` (test number)
- Your actual phone number (must be registered with Safaricom)

### **2. Test Flow:**
1. Start development server: `npm run dev`
2. Create a parcel with "Pay Now"
3. Use test phone number
4. Check M-Pesa prompt on phone
5. Enter PIN: `0000` (sandbox)

## 🔍 **Monitoring:**

- Check browser console for payment status logs
- Check server logs for M-Pesa API responses
- Check database `payment_transactions` table for audit trail

## 🚨 **Production Checklist:**

- [ ] Update M-Pesa credentials to production
- [ ] Change callback URL to your domain
- [ ] Set up SSL certificate for callbacks
- [ ] Test with real money (small amounts first)
- [ ] Monitor payment success rates
- [ ] Set up error alerting

## 📱 **Features Ready:**

✅ STK Push payments
✅ Real-time payment status
✅ Payment history tracking
✅ Dispatcher payment collection
✅ Customer payment options
✅ Payment audit trail
✅ Error handling and retry logic

**Your M-Pesa integration is ready to test!** 🎉
