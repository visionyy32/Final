import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Import M-Pesa services (dynamic import for ES modules)
let mpesaService, paymentService;

const app = express();
const PORT = process.env.PORT || 3003; // Use 3003 to avoid conflicts

// Middleware - Configure CORS for development
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'], // Allow frontend origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize services
async function initializeServices() {
  try {
    const mpesaModule = await import('./src/services/mpesaService.js');
    const paymentModule = await import('./src/services/paymentService.js');
    mpesaService = mpesaModule.default;
    paymentService = paymentModule.default;
    console.log('✅ M-Pesa services initialized');
  } catch (error) {
    console.error('❌ Failed to initialize M-Pesa services:', error);
    // Create mock services for development
    mpesaService = {
      initiateSTKPush: () => Promise.resolve({ CheckoutRequestID: 'mock-123', MerchantRequestID: 'mock-456', CustomerMessage: 'Mock payment initiated' }),
      processCallback: (data) => ({ success: true, checkoutRequestId: 'mock-123', resultCode: 0, resultDesc: 'Mock success' })
    };
    paymentService = {
      createPaymentTransaction: () => Promise.resolve({ id: Date.now() }),
      updatePaymentTransaction: () => Promise.resolve({}),
      getPaymentTransaction: () => Promise.resolve({ transaction_status: 'pending' }),
      updateParcelPaymentStatus: () => Promise.resolve({})
    };
  }
}

// Initialize services before starting server
await initializeServices();

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'M-Pesa Payment Server is running',
    port: PORT
  });
});

// M-Pesa API Routes
app.post('/api/mpesa/stk-push', async (req, res) => {
  console.log('🚀 STK Push endpoint hit');
  console.log('📨 Request body:', req.body);
  console.log('📨 Request headers:', req.headers);
  
  try {
    const {
      parcelId,
      parcelType,
      phoneNumber,
      amount,
      initiatedBy,
      initiatedByUserId
    } = req.body;

    console.log('✅ STK Push request data:', { parcelId, parcelType, phoneNumber, amount, initiatedBy });

    // Validate required fields
    if (!parcelId || !parcelType || !phoneNumber || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: parcelId, parcelType, phoneNumber, amount'
      });
    }

    // Get parcel details
    const parcel = await paymentService.getParcelForPayment(parcelId, parcelType);
    if (!parcel) {
      return res.status(404).json({
        success: false,
        message: 'Parcel not found'
      });
    }

    // Create account reference and transaction description
    const accountReference = parcel.tracking_number;
    const transactionDesc = `Payment for parcel ${parcel.tracking_number}`;

    // Initiate STK Push
    const stkResponse = await mpesaService.initiateSTKPush(
      phoneNumber,
      amount,
      accountReference,
      transactionDesc
    );

    // Create payment transaction record
    const paymentTransaction = await paymentService.createPaymentTransaction({
      parcelId,
      parcelType,
      customerPhone: phoneNumber,
      amount,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      merchantRequestId: stkResponse.MerchantRequestID,
      initiatedBy: initiatedBy || 'customer',
      initiatedByUserId
    });

    res.json({
      success: true,
      message: 'STK Push initiated successfully',
      data: {
        checkoutRequestId: stkResponse.CheckoutRequestID,
        merchantRequestId: stkResponse.MerchantRequestID,
        customerMessage: stkResponse.CustomerMessage,
        transactionId: paymentTransaction.id
      }
    });

  } catch (error) {
    console.error('STK Push error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate payment'
    });
  }
});

// M-Pesa callback endpoint
app.post('/api/mpesa/callback', async (req, res) => {
  try {
    console.log('M-Pesa callback received:', JSON.stringify(req.body, null, 2));

    // Process the callback
    const callbackResult = mpesaService.processCallback(req.body);
    console.log('Processed callback result:', callbackResult);

    // Update payment transaction
    const transactionStatus = callbackResult.success ? 'completed' : 'failed';
    const mpesaTransactionId = callbackResult.metadata?.mpesaReceiptNumber;

    await paymentService.updatePaymentTransaction(callbackResult.checkoutRequestId, {
      resultCode: callbackResult.resultCode,
      resultDesc: callbackResult.resultDesc,
      mpesaTransactionId,
      transactionStatus
    });

    // Get the payment transaction to find parcel details
    const paymentTransaction = await paymentService.getPaymentTransaction(callbackResult.checkoutRequestId);
    
    if (paymentTransaction) {
      // Update parcel payment status
      const paymentStatus = callbackResult.success ? 'completed' : 'failed';
      await paymentService.updateParcelPaymentStatus(
        paymentTransaction.parcel_id,
        paymentTransaction.parcel_type,
        {
          paymentStatus,
          mpesaTransactionId,
          checkoutRequestId: callbackResult.checkoutRequestId
        }
      );

      console.log(`Payment ${paymentStatus} for parcel ${paymentTransaction.parcel_id}`);
    }

    // Acknowledge the callback
    res.json({
      ResultCode: 0,
      ResultDesc: "Callback processed successfully"
    });

  } catch (error) {
    console.error('Callback processing error:', error);
    res.status(500).json({
      ResultCode: 1,
      ResultDesc: "Callback processing failed"
    });
  }
});

// Check payment status
app.get('/api/mpesa/payment-status/:checkoutRequestId', async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

    // Get payment transaction from database
    const paymentTransaction = await paymentService.getPaymentTransaction(checkoutRequestId);
    
    if (!paymentTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Payment transaction not found'
      });
    }

    // If still pending, query M-Pesa for latest status
    if (paymentTransaction.transaction_status === 'pending') {
      try {
        const stkStatus = await mpesaService.querySTKPushStatus(checkoutRequestId);
        console.log('STK Push status query:', stkStatus);
        
        // Update local status if M-Pesa has new information
        if (stkStatus.ResultCode !== undefined) {
          const transactionStatus = stkStatus.ResultCode === '0' ? 'completed' : 'failed';
          await paymentService.updatePaymentTransaction(checkoutRequestId, {
            resultCode: stkStatus.ResultCode,
            resultDesc: stkStatus.ResultDesc,
            transactionStatus
          });
          paymentTransaction.transaction_status = transactionStatus;
        }
      } catch (queryError) {
        console.log('STK status query failed (this is normal):', queryError.message);
      }
    }

    res.json({
      success: true,
      data: {
        transactionId: paymentTransaction.id,
        status: paymentTransaction.transaction_status,
        amount: paymentTransaction.amount,
        phoneNumber: paymentTransaction.customer_phone,
        resultDesc: paymentTransaction.result_desc,
        mpesaTransactionId: paymentTransaction.mpesa_transaction_id,
        createdAt: paymentTransaction.created_at,
        completedAt: paymentTransaction.completed_at
      }
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status'
    });
  }
});

// Get payment history for a parcel
app.get('/api/mpesa/payment-history/:parcelId/:parcelType', async (req, res) => {
  try {
    const { parcelId, parcelType } = req.params;
    
    const paymentHistory = await paymentService.getPaymentHistory(parcelId, parcelType);
    
    res.json({
      success: true,
      data: paymentHistory
    });

  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history'
    });
  }
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve index.html for all routes to support client-side routing (except API routes)
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
