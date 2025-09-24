import { useState } from 'react';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  parcel, 
  onPaymentSuccess, 
  initiatedBy = 'customer',
  initiatedByUserId = null 
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);

  console.log('🔍 PaymentModal render:', { 
    isOpen, 
    parcel: parcel ? 'exists' : 'missing',
    parcelId: parcel?.id,
    trackingNumber: parcel?.tracking_number 
  });
  
  if (!isOpen) {
    console.log('❌ PaymentModal not open');
    return null;
  }
  
  if (!parcel) {
    console.log('❌ PaymentModal no parcel data');
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-bold text-red-600 mb-4">Error</h3>
          <p className="text-gray-700 mb-4">No parcel data available for payment.</p>
          <button
            onClick={onClose}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const formatPhoneNumber = (phone) => {
    // Remove any spaces, dashes, or plus signs
    let cleaned = phone.replace(/[\s\-\+]/g, '');
    
    // If starts with 0, replace with 254
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    }
    
    // If doesn't start with 254, add it
    if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  };

  const initiatePayment = async () => {
    if (!phoneNumber.trim()) {
      alert('Please enter a phone number');
      return;
    }

    try {
      setIsProcessing(true);
      setPaymentStatus('initiating');

      console.log('🚀 Initiating payment request...');
      console.log('📞 Phone:', formatPhoneNumber(phoneNumber));
      console.log('💰 Amount:', parcel.total_cost);
      console.log('📦 Parcel:', parcel.id, parcel.tracking_number);

      const response = await fetch('http://localhost:3003/api/mpesa/stk-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parcelId: parcel.id,
          parcelType: parcel.type || 'regular',
          phoneNumber: formatPhoneNumber(phoneNumber),
          amount: parcel.total_cost || parcel.shippingCost || parcel.cost || 1000,
          initiatedBy,
          initiatedByUserId
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        throw new Error('Server returned non-JSON response. Check server logs.');
      }

      const result = await response.json();

      if (result.success) {
        setCheckoutRequestId(result.data.checkoutRequestId);
        setPaymentStatus('pending');
        
        // Start polling for payment status
        pollPaymentStatus(result.data.checkoutRequestId);
      } else {
        throw new Error(result.message || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('❌ Payment initiation error:', error);
      console.error('❌ Error type:', error.name);
      console.error('❌ Error message:', error.message);
      
      setPaymentStatus('error');
      
      // More specific error messages
      let errorMessage = 'Failed to initiate payment. Please try again.';
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Cannot connect to payment server. Please check if the backend server is running.';
      }
      
      alert(errorMessage);
      setIsProcessing(false);
    }
  };

  const pollPaymentStatus = async (requestId) => {
    let attempts = 0;
    const maxAttempts = 30; // Poll for 5 minutes (10 seconds interval)

    const checkStatus = async () => {
      try {
        const response = await fetch(`http://localhost:3003/api/mpesa/payment-status/${requestId}`);
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.log('Status check: Non-JSON response, skipping...');
          return;
        }

        const result = await response.json();

        if (result.success) {
          const status = result.data.status;

          if (status === 'completed') {
            setPaymentStatus('completed');
            setIsProcessing(false);
            onPaymentSuccess && onPaymentSuccess(result.data);
            setTimeout(() => {
              onClose();
            }, 3000);
          } else if (status === 'failed') {
            setPaymentStatus('failed');
            setIsProcessing(false);
          } else if (status === 'pending' && attempts < maxAttempts) {
            attempts++;
            setTimeout(checkStatus, 10000); // Check again in 10 seconds
          } else {
            // Timeout
            setPaymentStatus('timeout');
            setIsProcessing(false);
          }
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.error('Status check error:', error);
        setPaymentStatus('error');
        setIsProcessing(false);
      }
    };

    checkStatus();
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'initiating':
        return { message: 'Initiating payment...', color: 'text-blue-600' };
      case 'pending':
        return { message: 'Payment request sent to your phone. Please check your phone and enter your M-Pesa PIN.', color: 'text-orange-600' };
      case 'completed':
        return { message: 'Payment completed successfully! 🎉', color: 'text-green-600' };
      case 'failed':
        return { message: 'Payment failed. Please try again.', color: 'text-red-600' };
      case 'timeout':
        return { message: 'Payment timeout. Please try again.', color: 'text-red-600' };
      case 'error':
        return { message: 'An error occurred. Please try again.', color: 'text-red-600' };
      default:
        return null;
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">M-Pesa Payment</h3>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Parcel Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Payment Details</h4>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Tracking Number:</span> {parcel.tracking_number}</p>
              <p><span className="font-medium">Amount:</span> KSh {(parcel.total_cost || parcel.shippingCost || parcel.cost || 1000)?.toLocaleString()}</p>
              {parcel.recipient_name && (
                <p><span className="font-medium">Recipient:</span> {parcel.recipient_name}</p>
              )}
            </div>
          </div>

          {/* Phone Number Input */}
          {!paymentStatus && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g., 0712345678"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the phone number registered with M-Pesa
              </p>
            </div>
          )}

          {/* Status Message */}
          {statusInfo && (
            <div className={`p-4 rounded-lg border-l-4 ${
              statusInfo.color.includes('green') ? 'bg-green-50 border-green-400' :
              statusInfo.color.includes('red') ? 'bg-red-50 border-red-400' :
              statusInfo.color.includes('orange') ? 'bg-orange-50 border-orange-400' :
              'bg-blue-50 border-blue-400'
            }`}>
              <p className={`text-sm ${statusInfo.color}`}>
                {statusInfo.message}
              </p>
              {paymentStatus === 'pending' && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                    <span className="text-xs text-orange-600">Waiting for payment confirmation...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {!paymentStatus && (
              <button
                onClick={initiatePayment}
                disabled={!phoneNumber.trim() || isProcessing}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : `Pay KSh ${parcel.total_cost?.toLocaleString()}`}
              </button>
            )}
            
            <button
              onClick={onClose}
              disabled={isProcessing && paymentStatus === 'pending'}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {paymentStatus === 'completed' ? 'Close' : 'Cancel'}
            </button>
          </div>

          {/* Instructions */}
          {paymentStatus === 'pending' && (
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md">
              <p className="font-medium mb-1">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Check your phone for M-Pesa payment request</li>
                <li>Enter your M-Pesa PIN to complete payment</li>
                <li>Wait for confirmation (this may take a few seconds)</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
