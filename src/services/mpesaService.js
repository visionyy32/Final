// M-Pesa Integration Service
import axios from 'axios';
import crypto from 'crypto';

class MpesaService {
  constructor() {
    // Sandbox credentials - replace with production when ready
    this.consumerKey = process.env.MPESA_CONSUMER_KEY || 'your_consumer_key';
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || 'your_consumer_secret';
    this.businessShortCode = process.env.MPESA_SHORTCODE || '174379';
    this.passkey = process.env.MPESA_PASSKEY || 'your_passkey';
    this.baseURL = process.env.MPESA_ENV === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
    this.callbackURL = process.env.MPESA_CALLBACK_URL || 'https://yourdomain.com/api/mpesa/callback';
  }

  // Generate access token
  async getAccessToken() {
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await axios.get(`${this.baseURL}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      return response.data.access_token;
    } catch (error) {
      console.error('Error getting M-Pesa access token:', error.response?.data || error.message);
      throw new Error('Failed to get M-Pesa access token');
    }
  }

  // Generate password for STK Push
  generatePassword() {
    const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
    const password = Buffer.from(`${this.businessShortCode}${this.passkey}${timestamp}`).toString('base64');
    return { password, timestamp };
  }

  // Format phone number to M-Pesa format (254XXXXXXXXX)
  formatPhoneNumber(phoneNumber) {
    // Remove any spaces, dashes, or plus signs
    let cleaned = phoneNumber.replace(/[\s\-\+]/g, '');
    
    // If starts with 0, replace with 254
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    }
    
    // If doesn't start with 254, add it
    if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  }

  // Initiate STK Push
  async initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc) {
    try {
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const requestData = {
        BusinessShortCode: this.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(amount), // M-Pesa requires integer amounts
        PartyA: formattedPhone,
        PartyB: this.businessShortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: this.callbackURL,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc
      };

      console.log('Initiating STK Push:', {
        phone: formattedPhone,
        amount,
        reference: accountReference
      });

      const response = await axios.post(
        `${this.baseURL}/mpesa/stkpush/v1/processrequest`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('STK Push Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('STK Push Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errorMessage || 'Failed to initiate STK Push');
    }
  }

  // Query STK Push status
  async querySTKPushStatus(checkoutRequestId) {
    try {
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();

      const requestData = {
        BusinessShortCode: this.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      };

      const response = await axios.post(
        `${this.baseURL}/mpesa/stkpushquery/v1/query`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('STK Push Query Error:', error.response?.data || error.message);
      throw new Error('Failed to query STK Push status');
    }
  }

  // Process M-Pesa callback
  processCallback(callbackData) {
    try {
      const {
        MerchantRequestID,
        CheckoutRequestID,
        ResultCode,
        ResultDesc,
        CallbackMetadata
      } = callbackData.Body.stkCallback;

      const result = {
        merchantRequestId: MerchantRequestID,
        checkoutRequestId: CheckoutRequestID,
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        success: ResultCode === 0
      };

      // If successful, extract transaction details
      if (result.success && CallbackMetadata?.Item) {
        const metadata = {};
        CallbackMetadata.Item.forEach(item => {
          switch (item.Name) {
            case 'Amount':
              metadata.amount = item.Value;
              break;
            case 'MpesaReceiptNumber':
              metadata.mpesaReceiptNumber = item.Value;
              break;
            case 'Balance':
              metadata.balance = item.Value;
              break;
            case 'TransactionDate':
              metadata.transactionDate = item.Value;
              break;
            case 'PhoneNumber':
              metadata.phoneNumber = item.Value;
              break;
          }
        });
        result.metadata = metadata;
      }

      return result;
    } catch (error) {
      console.error('Error processing M-Pesa callback:', error);
      throw new Error('Failed to process M-Pesa callback');
    }
  }
}

export default new MpesaService();
