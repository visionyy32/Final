# TrackFlow Supabase Setup Guide

## Prerequisites
- Supabase account and project created
- Your Supabase project URL and anon key (already provided)

## Step 1: Set up the Database

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `supabase-setup.sql` into the SQL editor
4. Click **Run** to execute the script

This will create:
- `users` table (extends auth.users)
- `parcels` table
- `support_messages` table
- `chat_messages` table
- `admin_logs` table
- Row Level Security (RLS) policies
- Database triggers and functions

## Step 2: Configure Authentication

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Under **Site URL**, add your development URL (e.g., `http://localhost:5173`)
3. Under **Redirect URLs**, add your development URL
4. Save the changes

## Step 3: Test the Connection

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the application and try to:
   - Sign up as a new user
   - Sign in as an existing user
   - Place a parcel
   - Check the admin dashboard for user management

## Step 4: Create an Admin User

To create an admin user, you can either:

### Option A: Update via Supabase Dashboard
1. Go to **Table Editor** → **users**
2. Find your user record
3. Change the `role` field from `user` to `admin`
4. Save the changes

### Option B: Update via SQL
```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

## Database Schema Overview

### Users Table
- `id`: UUID (references auth.users)
- `email`: TEXT (unique)
- `name`: TEXT
- `phone`: TEXT
- `role`: TEXT (user/admin)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### Parcels Table
- `id`: UUID
- `tracking_number`: TEXT (unique)
- `user_id`: UUID (references users)
- `sender_name`: TEXT
- `sender_address`: TEXT
- `sender_county`: TEXT
- `sender_phone`: TEXT
- `sender_commuter`: TEXT
- `recipient_name`: TEXT
- `recipient_address`: TEXT
- `recipient_county`: TEXT
- `recipient_phone`: TEXT
- `parcel_description`: TEXT
- `parcel_weight`: DECIMAL
- `parcel_length`: DECIMAL
- `parcel_width`: DECIMAL
- `parcel_height`: DECIMAL
- `special_instructions`: TEXT
- `status`: TEXT (Pending Pickup/In Transit/Delivered)
- `cost`: DECIMAL
- `estimated_delivery`: DATE
- `current_location`: TEXT
- `destination`: TEXT
- `last_update`: TIMESTAMP
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### Support Messages Table
- `id`: UUID
- `user_id`: UUID (references users)
- `name`: TEXT
- `email`: TEXT
- `phone`: TEXT
- `subject`: TEXT
- `message`: TEXT
- `status`: TEXT (Pending/In Progress/Resolved)
- `admin_response`: TEXT
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### Chat Messages Table
- `id`: UUID
- `user_id`: UUID (references users)
- `session_id`: TEXT
- `sender_name`: TEXT
- `message`: TEXT
- `is_admin`: BOOLEAN
- `created_at`: TIMESTAMP

### Admin Logs Table
- `id`: UUID
- `admin_id`: UUID (references users)
- `action`: TEXT
- `details`: JSONB
- `created_at`: TIMESTAMP

## Security Features

The database includes Row Level Security (RLS) policies that ensure:

1. **Users can only see their own data**:
   - Parcels
   - Support messages
   - Chat messages

2. **Admins can see all data**:
   - All parcels
   - All support messages
   - All chat messages
   - All users
   - Admin logs

3. **Automatic user creation**:
   - When a user signs up, a record is automatically created in the `users` table

## Troubleshooting

### Common Issues

1. **"Error loading users"**
   - Check if the SQL script was executed successfully
   - Verify RLS policies are in place

2. **"Error loading parcels"**
   - Ensure the parcels table was created
   - Check if user authentication is working

3. **"Permission denied"**
   - Verify the user is authenticated
   - Check if the user has the correct role

### Debugging

1. Check the browser console for error messages
2. Verify Supabase connection in the Network tab
3. Check Supabase logs in the dashboard

## Next Steps

Once the basic setup is working, you can:

1. **Add real-time features**: Enable real-time subscriptions for live updates
2. **Implement file uploads**: Add parcel image uploads
3. **Add email notifications**: Set up email triggers for status updates
4. **Add payment integration**: Connect to payment gateways
5. **Add Google Maps integration**: Implement live tracking

## Support

If you encounter any issues:

1. Check the Supabase documentation
2. Review the error messages in the browser console
3. Check the Supabase logs in the dashboard
4. Verify all SQL scripts were executed successfully 