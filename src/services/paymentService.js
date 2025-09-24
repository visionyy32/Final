// Payment Service for handling payment database operations
import { createClient } from '@supabase/supabase-js';

// Set up Supabase connection for server-side use
let supabase;
try {
  const supabaseUrl = process.env.SUPABASE_URL || 'your_supabase_url';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your_supabase_anon_key';
  
  if (supabaseUrl !== 'your_supabase_url' && supabaseKey !== 'your_supabase_anon_key') {
    supabase = createClient(supabaseUrl, supabaseKey);
  } else {
    throw new Error('Supabase credentials not configured');
  }
} catch (error) {
  console.warn('Supabase not configured for server-side use. Using mock implementation.');
  // Mock supabase for development
  supabase = {
    from: (table) => ({
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: Date.now() }, error: null }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: {}, error: null }) }) }) }),
      select: () => ({ 
        eq: () => ({ single: () => Promise.resolve({ data: { id: Date.now(), transaction_status: 'pending' }, error: null }) }),
        order: () => Promise.resolve({ data: [], error: null })
      })
    })
  };
}

class PaymentService {
  // Create payment transaction record
  async createPaymentTransaction(data) {
    try {
      const {
        parcelId,
        parcelType,
        customerPhone,
        amount,
        checkoutRequestId,
        merchantRequestId,
        initiatedBy,
        initiatedByUserId
      } = data;

      const { data: transaction, error } = await supabase
        .from('payment_transactions')
        .insert({
          parcel_id: parcelId,
          parcel_type: parcelType,
          customer_phone: customerPhone,
          amount: amount,
          checkout_request_id: checkoutRequestId,
          merchant_request_id: merchantRequestId,
          transaction_status: 'pending',
          initiated_by: initiatedBy,
          initiated_by_user_id: initiatedByUserId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating payment transaction:', error);
        throw error;
      }

      return transaction;
    } catch (error) {
      console.error('Error in createPaymentTransaction:', error);
      throw error;
    }
  }

  // Update payment transaction status
  async updatePaymentTransaction(checkoutRequestId, updateData) {
    try {
      const {
        resultCode,
        resultDesc,
        mpesaTransactionId,
        transactionStatus,
        metadata
      } = updateData;

      const updatePayload = {
        result_code: resultCode,
        result_desc: resultDesc,
        transaction_status: transactionStatus
      };

      if (mpesaTransactionId) {
        updatePayload.mpesa_transaction_id = mpesaTransactionId;
      }

      if (transactionStatus === 'completed') {
        updatePayload.completed_at = new Date().toISOString();
      }

      const { data: transaction, error } = await supabase
        .from('payment_transactions')
        .update(updatePayload)
        .eq('checkout_request_id', checkoutRequestId)
        .select()
        .single();

      if (error) {
        console.error('Error updating payment transaction:', error);
        throw error;
      }

      return transaction;
    } catch (error) {
      console.error('Error in updatePaymentTransaction:', error);
      throw error;
    }
  }

  // Update parcel payment status
  async updateParcelPaymentStatus(parcelId, parcelType, paymentData) {
    try {
      const {
        paymentStatus,
        mpesaTransactionId,
        checkoutRequestId
      } = paymentData;

      const updatePayload = {
        payment_status: paymentStatus
      };

      if (mpesaTransactionId) {
        updatePayload.mpesa_transaction_id = mpesaTransactionId;
      }

      if (checkoutRequestId) {
        updatePayload.mpesa_checkout_id = checkoutRequestId;
      }

      if (paymentStatus === 'completed') {
        updatePayload.paid_at = new Date().toISOString();
      }

      // Update the appropriate table based on parcel type
      let tableName;
      switch (parcelType) {
        case 'regular':
          tableName = 'parcels';
          break;
        case 'cold_chain':
          tableName = 'cold_chain_bookings';
          break;
        case 'international':
          tableName = 'international_shipping';
          break;
        case 'special':
          tableName = 'special_delivery';
          break;
        default:
          throw new Error(`Unknown parcel type: ${parcelType}`);
      }

      const { data: parcel, error } = await supabase
        .from(tableName)
        .update(updatePayload)
        .eq('id', parcelId)
        .select()
        .single();

      if (error) {
        console.error(`Error updating ${tableName} payment status:`, error);
        throw error;
      }

      return parcel;
    } catch (error) {
      console.error('Error in updateParcelPaymentStatus:', error);
      throw error;
    }
  }

  // Get payment transaction by checkout request ID
  async getPaymentTransaction(checkoutRequestId) {
    try {
      const { data: transaction, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('checkout_request_id', checkoutRequestId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error getting payment transaction:', error);
        throw error;
      }

      return transaction;
    } catch (error) {
      console.error('Error in getPaymentTransaction:', error);
      throw error;
    }
  }

  // Get parcel details for payment
  async getParcelForPayment(parcelId, parcelType) {
    try {
      let tableName;
      
      switch (parcelType) {
        case 'regular':
          tableName = 'parcels';
          break;
        case 'cold_chain':
          tableName = 'cold_chain_bookings';
          break;
        case 'international':
          tableName = 'international_shipping';
          break;
        case 'special':
          tableName = 'special_delivery';
          break;
        default:
          throw new Error(`Unknown parcel type: ${parcelType}`);
      }

      // Convert parcelId to match the database format
      const searchId = parcelId;
      
      // First try to get the parcel with all fields
      let { data: parcel, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', searchId)
        .single();

      if (error) {
        console.error(`Error getting ${tableName} for payment:`, error);
        throw error;
      }

      // If parcel doesn't have total_cost, calculate it from shippingCost or set a default
      if (!parcel.total_cost && parcel.shippingCost) {
        parcel.total_cost = parcel.shippingCost;
      } else if (!parcel.total_cost) {
        // Default cost based on parcel type
        parcel.total_cost = 1000; // Default KES 1000
      }

      if (error) {
        console.error(`Error getting ${tableName} for payment:`, error);
        throw error;
      }

      return parcel;
    } catch (error) {
      console.error('Error in getParcelForPayment:', error);
      throw error;
    }
  }

  // Get payment history for a parcel
  async getPaymentHistory(parcelId, parcelType) {
    try {
      const { data: transactions, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('parcel_id', parcelId)
        .eq('parcel_type', parcelType)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting payment history:', error);
        throw error;
      }

      return transactions || [];
    } catch (error) {
      console.error('Error in getPaymentHistory:', error);
      throw error;
    }
  }
}

export default new PaymentService();
