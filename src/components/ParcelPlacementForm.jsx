import { useState, useEffect } from 'react'
import PaymentModal from './PaymentModal'

const ParcelPlacementForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    // Sender Information
    senderName: '',
    senderEmail: '',
    senderAddress: '',
    senderCounty: '',
    senderPhone: '',
    senderCommuter: '',
    
    // Recipient Information
    recipientName: '',
    recipientEmail: '',
    recipientAddress: '',
    recipientCounty: '',
    recipientPhone: '',
    
    // Parcel Information
    parcelDescription: '',
    parcelWeight: '',
    parcelDimensions: '',
    specialInstructions: '',
    
    // Payment Information
    paymentMethod: 'pay_on_delivery'
  })

  const [showConfirmation, setShowConfirmation] = useState(false)
  const [calculatedCost, setCalculatedCost] = useState(0)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Debug useEffect to track payment modal state changes
  useEffect(() => {
    console.log('🔄 Payment modal state changed:', showPaymentModal);
  }, [showPaymentModal]);

  const counties = [
    'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita Taveta', 'Garissa', 'Wajir', 'Mandera',
    'Marsabit', 'Isiolo', 'Meru', 'Tharaka Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua',
    'Nyeri', 'Kirinyaga', 'Murang\'a', 'Kiambu', 'Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia',
    'Uasin Gishu', 'Elgeyo Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado',
    'Kericho', 'Bomet', 'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya', 'Kisumu', 'Homa Bay',
    'Migori', 'Kisii', 'Nyamira', 'Nairobi'
  ]

  const commuters = [
    'Easy Coach',
    'Mash Poa',
    'Modern Coast',
    'The Guardian',
    'Enacoach',
    'Nyamira Express',
    '2NK',
    'Southrift Sacco',
    'North Rift Sacco'
  ]

  // Calculate shipping cost based on weight and distance
  const calculateShippingCost = (weight, senderCounty, recipientCounty) => {
    // Base cost
    let baseCost = 500 // KES
    
    // Add weight-based cost (KES 100 per kg)
    const weightCost = weight * 100
    
    // Add distance-based cost (simplified calculation)
    const distanceCost = calculateDistanceCost(senderCounty, recipientCounty)
    
    return baseCost + weightCost + distanceCost
  }

  // Calculate distance cost based on counties
  const calculateDistanceCost = (senderCounty, recipientCounty) => {
    // Simplified distance calculation
    // In a real application, you would use actual distance data
    
    const sameCounty = senderCounty === recipientCounty
    const nearbyCounties = getNearbyCounties(senderCounty)
    const isNearby = nearbyCounties.includes(recipientCounty)
    
    if (sameCounty) {
      return 0 // Same county delivery
    } else if (isNearby) {
      return 200 // Nearby county
    } else {
      return 500 // Distant county
    }
  }

  // Get nearby counties (simplified)
  const getNearbyCounties = (county) => {
    const countyGroups = {
      'Nairobi': ['Kiambu', 'Machakos', 'Kajiado'],
      'Mombasa': ['Kwale', 'Kilifi'],
      'Kisumu': ['Siaya', 'Homa Bay', 'Migori'],
      'Nakuru': ['Narok', 'Baringo', 'Laikipia'],
      'Eldoret': ['Uasin Gishu', 'Nandi', 'Elgeyo Marakwet']
    }
    
    return countyGroups[county] || []
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate required fields
    const requiredFields = [
      'senderName', 'senderAddress', 'senderCounty', 'senderPhone', 'senderCommuter',
      'recipientName', 'recipientAddress', 'recipientCounty', 'recipientPhone',
      'parcelDescription', 'parcelWeight'
    ]
    
    const missingFields = requiredFields.filter(field => !formData[field])
    
    if (missingFields.length > 0) {
      alert('Please fill in all required fields')
      return
    }

    // Calculate shipping cost
    const weight = parseFloat(formData.parcelWeight) || 0
    const cost = calculateShippingCost(weight, formData.senderCounty, formData.recipientCounty)
    setCalculatedCost(cost)
    setShowConfirmation(true)
  }

  const handleConfirmOrder = async () => {
    console.log('🔍 Payment method selected:', formData.paymentMethod);
    console.log('🔍 Should open payment modal:', formData.paymentMethod === 'pay_now');
    
    // Generate unique tracking number with exactly 8 digits
    const randomDigits = Math.floor(Math.random() * 90000000) + 10000000 // Generates 8-digit number (10000000-99999999)
    const trackingNumber = `TRK${randomDigits}`
    
    const parcelData = {
      ...formData,
      trackingNumber: trackingNumber,
      status: 'Pending Pickup', // Use allowed database status value
      dateCreated: new Date().toISOString(),
      // Remove manual ID generation - let Supabase auto-generate UUID
      shippingCost: calculatedCost,
      total_cost: calculatedCost,
      payment_method: formData.paymentMethod,
      payment_status: formData.paymentMethod === 'pay_now' ? 'pending' : 'pending',
      type: 'regular'
    }

    if (formData.paymentMethod === 'pay_now') {
      // For "Pay Now", save the parcel first to get the UUID, then initiate payment
      try {
        console.log('🔄 Attempting to save parcel for payment...', parcelData);
        const savedParcel = await onSubmit(parcelData)
        console.log('💾 Parcel save result:', savedParcel);
        
        if (savedParcel && savedParcel.id) {
          // Now we have the real parcel ID from database
          console.log('✅ Parcel saved successfully, opening payment modal');
          window.tempParcelData = savedParcel
          // Close confirmation modal first, then open payment modal
          setShowConfirmation(false)
          // Use setTimeout to ensure the confirmation modal closes before opening payment modal
          setTimeout(() => {
            console.log('🔄 Setting showPaymentModal to true');
            setShowPaymentModal(true)
            console.log('🔄 Payment modal should be open now');
          }, 100)
        } else {
          console.error('❌ Parcel save failed - no ID returned');
          alert('Failed to save parcel. Please try again.')
        }
      } catch (error) {
        console.error('Error saving parcel for payment:', error)
        setError('Failed to save parcel. Please try again.')
      }
    } else {
      // Submit directly for pay on delivery
      onSubmit(parcelData)
      resetForm()
    }
  }

  const handlePaymentSuccess = (paymentData) => {
    console.log('Payment successful:', paymentData)
    // Parcel is already saved, just reset the form and close modal
    resetForm()
    setShowPaymentModal(false)
    // Clean up temp data
    if (window.tempParcelData) {
      delete window.tempParcelData
    }
  }

  const resetForm = () => {
    // Reset form
    setFormData({
      senderName: '',
      senderEmail: '',
      senderAddress: '',
      senderCounty: '',
      senderPhone: '',
      senderCommuter: '',
      recipientName: '',
      recipientEmail: '',
      recipientAddress: '',
      recipientCounty: '',
      recipientPhone: '',
      parcelDescription: '',
      parcelWeight: '',
      parcelDimensions: '',
      specialInstructions: '',
      paymentMethod: 'pay_on_delivery'
    })
    
    setShowConfirmation(false)
    setCalculatedCost(0)
    delete window.tempParcelData
  }

  const handleCancelOrder = () => {
    setShowConfirmation(false)
    setCalculatedCost(0)
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Place Your Parcel</h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Sender Information */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-blue-900 mb-4">Sender Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="senderName"
                value={formData.senderName}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter sender's full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="senderEmail"
                value={formData.senderEmail}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="sender@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="senderPhone"
                value={formData.senderPhone}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., +254 714 468 611"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <textarea
                name="senderAddress"
                value={formData.senderAddress}
                onChange={handleInputChange}
                required
                rows="3"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter complete address"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                County *
              </label>
              <select
                name="senderCounty"
                value={formData.senderCounty}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select County</option>
                {counties.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commuter *
              </label>
              <select
                name="senderCommuter"
                value={formData.senderCommuter}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Commuter</option>
                {commuters.map(commuter => (
                  <option key={commuter} value={commuter}>{commuter}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Recipient Information */}
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-green-900 mb-4">Recipient Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="recipientName"
                value={formData.recipientName}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter recipient's full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="recipientEmail"
                value={formData.recipientEmail}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="recipient@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="recipientPhone"
                value={formData.recipientPhone}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., +254 795 291 982"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <textarea
                name="recipientAddress"
                value={formData.recipientAddress}
                onChange={handleInputChange}
                required
                rows="3"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter complete address"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                County *
              </label>
              <select
                name="recipientCounty"
                value={formData.recipientCounty}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select County</option>
                {counties.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Parcel Information */}
        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-purple-900 mb-4">Parcel Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parcel Description *
              </label>
              <textarea
                name="parcelDescription"
                value={formData.parcelDescription}
                onChange={handleInputChange}
                required
                rows="3"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Describe what's in the parcel"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg) *
              </label>
              <input
                type="number"
                name="parcelWeight"
                value={formData.parcelWeight}
                onChange={handleInputChange}
                required
                min="0.1"
                step="0.1"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., 2.5"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dimensions (optional)
              </label>
              <input
                type="text"
                name="parcelDimensions"
                value={formData.parcelDimensions}
                onChange={handleInputChange}
                className="w-2/3 border border-purple-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50"
                placeholder="e.g., 30cm x 20cm x 15cm"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions (optional)
              </label>
              <textarea
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleInputChange}
                rows="3"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Any special handling instructions"
              />
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="bg-green-50 p-6 rounded-lg shadow-lg border-2 border-green-300">
          <h3 className="text-xl font-bold text-green-800 mb-4">💳 Choose Payment Method</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="radio"
                id="pay_on_delivery"
                name="paymentMethod"
                value="pay_on_delivery"
                checked={formData.paymentMethod === 'pay_on_delivery'}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="pay_on_delivery" className="ml-3 block text-sm font-medium text-gray-700">
                <span className="font-semibold">Pay on Delivery</span>
                <p className="text-gray-500 text-xs mt-1">Pay when the parcel is delivered to you via M-Pesa</p>
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="radio"
                id="pay_now"
                name="paymentMethod"
                value="pay_now"
                checked={formData.paymentMethod === 'pay_now'}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
              />
              <label htmlFor="pay_now" className="ml-3 block text-sm font-medium text-gray-700">
                <span className="font-semibold text-green-600">Pay Now (M-Pesa) 📱</span>
                <p className="text-green-600 text-xs mt-1">You'll enter your M-Pesa phone number after placing the order</p>
                <p className="text-gray-500 text-xs">Pay immediately and get priority processing</p>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            type="submit"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg"
          >
            Create Order
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Order Summary</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                  <p className="text-2xl font-bold text-blue-600">
                    KES {calculatedCost.toLocaleString()}
                  </p>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Weight: {formData.parcelWeight} kg</p>
                  <p>• From: {formData.senderCounty}</p>
                  <p>• To: {formData.recipientCounty}</p>
                  <p>• Commuter: {formData.senderCommuter}</p>
                  <p>• Payment: <span className="font-semibold">{formData.paymentMethod === 'pay_now' ? 'Pay Now (M-Pesa)' : 'Pay on Delivery'}</span></p>
                </div>
              </div>
              
              {formData.paymentMethod === 'pay_now' ? (
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                  <p className="text-sm text-green-800">
                    <strong>📱 M-Pesa Payment:</strong> After confirming, you'll enter your M-Pesa phone number 
                    and receive an STK push notification to complete payment.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Payment will be collected upon parcel pickup or delivery. 
                    This order creates a booking for your parcel shipment.
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmOrder}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md font-medium hover:bg-green-700 transition-colors"
                >
                  Confirm Order
                </button>
                <button
                  onClick={handleCancelOrder}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Always render PaymentModal - it handles its own visibility */}
      {console.log('🎯 About to render PaymentModal - showPaymentModal:', showPaymentModal, 'parcelData exists:', !!window.tempParcelData)}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          console.log('🔒 Closing payment modal');
          setShowPaymentModal(false)
          delete window.tempParcelData
        }}
        parcel={window.tempParcelData}
        onPaymentSuccess={handlePaymentSuccess}
        initiatedBy="customer"
      />
    </div>
  )
}

export default ParcelPlacementForm 