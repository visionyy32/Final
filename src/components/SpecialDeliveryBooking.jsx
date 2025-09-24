import React, { useState, useEffect } from 'react'
import { specialDeliveryService } from '../services/specialDeliveryService'
import { expressDeliveryService } from '../services/expressDeliveryService'

const SpecialDeliveryBooking = ({ 
  isOpen, 
  onClose, 
  serviceType, 
  serviceName,
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    // Sender information
    senderName: '',
    senderAddress: '',
    senderPhone: '',
    senderEmail: '', // For guest users
    
    // Recipient information
    recipientName: '',
    recipientAddress: '',
    recipientPhone: '',
    
    // Pickup details
    pickupDate: '',
    preferredTime: '',
    
    // Product details
    productDescription: '',
    productType: 'other',
    fragility: 'normal',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    
    // Special requirements
    temperatureControlled: false,
    temperatureRange: '',
    specialInstructions: '',
    
    // Distance (will be calculated or entered)
    distance: ''
  })

  const [pricing, setPricing] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  // Calculate pricing when relevant fields change
  useEffect(() => {
    if (formData.distance && formData.weight && formData.productType && formData.fragility) {
      let calculatedPricing
      
      if (serviceType === 'express_delivery') {
        // Use Express Delivery pricing
        calculatedPricing = expressDeliveryService.calculatePricing(
          parseFloat(formData.weight),
          parseFloat(formData.distance),
          'standard', // Default express type
          formData.fragility !== 'normal', // fragile handling
          false, // insurance not required by default
          0 // declared value
        )
      } else {
        // Use Special Delivery pricing for other services
        calculatedPricing = specialDeliveryService.calculatePricing(
          parseFloat(formData.distance),
          formData.productType,
          serviceType,
          parseFloat(formData.weight),
          formData.fragility
        )
      }
      
      setPricing(calculatedPricing)
    }
  }, [formData.distance, formData.weight, formData.productType, formData.fragility, serviceType])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Required fields validation
    const requiredFields = [
      'senderName', 'senderAddress', 'senderPhone',
      'recipientName', 'recipientAddress', 'recipientPhone',
      'pickupDate', 'productDescription', 'weight', 'distance'
    ]
    
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors[field] = 'This field is required'
      }
    })
    
    // Phone number validation
    const phoneRegex = /^[0-9]{10,13}$/
    if (formData.senderPhone && !phoneRegex.test(formData.senderPhone.replace(/[^0-9]/g, ''))) {
      newErrors.senderPhone = 'Please enter a valid phone number'
    }
    if (formData.recipientPhone && !phoneRegex.test(formData.recipientPhone.replace(/[^0-9]/g, ''))) {
      newErrors.recipientPhone = 'Please enter a valid phone number'
    }
    
    // Weight validation
    if (formData.weight && (isNaN(formData.weight) || parseFloat(formData.weight) <= 0)) {
      newErrors.weight = 'Please enter a valid weight in kg'
    }
    
    // Distance validation
    if (formData.distance && (isNaN(formData.distance) || parseFloat(formData.distance) <= 0)) {
      newErrors.distance = 'Please enter a valid distance in km'
    }
    
    // Date validation
    if (formData.pickupDate) {
      const selectedDate = new Date(formData.pickupDate)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      if (selectedDate < tomorrow) {
        newErrors.pickupDate = 'Pickup date must be at least tomorrow'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      let result
      
      if (serviceType === 'express_delivery') {
        // Use Express Delivery Service for express_delivery
        const orderData = {
          senderName: formData.senderName,
          senderEmail: formData.senderEmail,
          senderPhone: formData.senderPhone,
          senderAddress: formData.senderAddress,
          recipientName: formData.recipientName,
          recipientPhone: formData.recipientPhone,
          recipientAddress: formData.recipientAddress,
          pickupDate: formData.pickupDate,
          preferredPickupTime: formData.preferredTime,
          productDescription: formData.productDescription,
          productType: formData.productType,
          packageType: formData.productType,
          weight: parseFloat(formData.weight),
          distance: parseFloat(formData.distance),
          declaredValue: 0, // Default value
          fragileHandling: formData.fragility !== 'normal',
          insuranceRequired: false, // Default
          expressType: 'standard', // Default for now
          specialInstructions: formData.specialInstructions,
          totalCost: pricing ? pricing.totalCost : 0
        }
        
        result = await expressDeliveryService.createOrder(orderData)
      } else {
        // Use Special Delivery Service for other services
        const orderData = {
          ...formData,
          serviceType,
          distance: parseFloat(formData.distance),
          weight: parseFloat(formData.weight),
          dimensions: formData.dimensions.length ? formData.dimensions : null
        }
        
        result = await specialDeliveryService.createOrder(orderData)
      }
      
      if (result.success) {
        onSuccess && onSuccess(result.data, result.orderNumber || result.quoteNumber, result.isGuest)
        onClose()
        // Reset form
        setFormData({
          senderName: '', senderAddress: '', senderPhone: '', senderEmail: '',
          recipientName: '', recipientAddress: '', recipientPhone: '',
          pickupDate: '', preferredTime: '', productDescription: '',
          productType: 'other', fragility: 'normal', weight: '',
          dimensions: { length: '', width: '', height: '' },
          temperatureControlled: false, temperatureRange: '',
          specialInstructions: '', distance: ''
        })
      } else {
        setErrors({ general: result.error || 'Failed to create order. Please try again.' })
      }
    } catch (error) {
      console.error('Booking error:', error)
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{serviceName} Booking</h2>
              <p className="text-slate-200 mt-1">Fill in the details for your special delivery</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-slate-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          {/* Sender Information */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Sender Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="senderName"
                  value={formData.senderName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent ${
                    errors.senderName ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="Enter sender's full name"
                />
                {errors.senderName && <p className="text-red-500 text-sm mt-1">{errors.senderName}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <input
                  type="email"
                  name="senderEmail"
                  value={formData.senderEmail}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent ${
                    errors.senderEmail ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="your.email@example.com (for order updates)"
                />
                {errors.senderEmail && <p className="text-red-500 text-sm mt-1">{errors.senderEmail}</p>}
                <p className="text-xs text-slate-600 mt-1">Optional: We'll send order updates to this email</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="senderPhone"
                  value={formData.senderPhone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent ${
                    errors.senderPhone ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., +254712345678"
                />
                {errors.senderPhone && <p className="text-red-500 text-sm mt-1">{errors.senderPhone}</p>}
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Pickup Address *</label>
              <textarea
                name="senderAddress"
                value={formData.senderAddress}
                onChange={handleInputChange}
                rows="2"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent ${
                  errors.senderAddress ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Enter complete pickup address"
              />
              {errors.senderAddress && <p className="text-red-500 text-sm mt-1">{errors.senderAddress}</p>}
            </div>
          </div>

          {/* Recipient Information */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Recipient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent ${
                    errors.recipientName ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="Enter recipient's full name"
                />
                {errors.recipientName && <p className="text-red-500 text-sm mt-1">{errors.recipientName}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="recipientPhone"
                  value={formData.recipientPhone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent ${
                    errors.recipientPhone ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., +254712345678"
                />
                {errors.recipientPhone && <p className="text-red-500 text-sm mt-1">{errors.recipientPhone}</p>}
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Address *</label>
              <textarea
                name="recipientAddress"
                value={formData.recipientAddress}
                onChange={handleInputChange}
                rows="2"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent ${
                  errors.recipientAddress ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Enter complete delivery address"
              />
              {errors.recipientAddress && <p className="text-red-500 text-sm mt-1">{errors.recipientAddress}</p>}
            </div>
          </div>

          {/* Pickup Schedule */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Pickup Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pickup Date *</label>
                <input
                  type="date"
                  name="pickupDate"
                  value={formData.pickupDate}
                  onChange={handleInputChange}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Tomorrow
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent ${
                    errors.pickupDate ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {errors.pickupDate && <p className="text-red-500 text-sm mt-1">{errors.pickupDate}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Time</label>
                <select
                  name="preferredTime"
                  value={formData.preferredTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  <option value="">Select preferred time</option>
                  <option value="08:00-10:00">8:00 AM - 10:00 AM</option>
                  <option value="10:00-12:00">10:00 AM - 12:00 PM</option>
                  <option value="12:00-14:00">12:00 PM - 2:00 PM</option>
                  <option value="14:00-16:00">2:00 PM - 4:00 PM</option>
                  <option value="16:00-18:00">4:00 PM - 6:00 PM</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Product Details</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Product Description *</label>
              <textarea
                name="productDescription"
                value={formData.productDescription}
                onChange={handleInputChange}
                rows="2"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent ${
                  errors.productDescription ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Describe what you're sending..."
              />
              {errors.productDescription && <p className="text-red-500 text-sm mt-1">{errors.productDescription}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Product Type *</label>
                <select
                  name="productType"
                  value={formData.productType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  <option value="documents">Documents</option>
                  <option value="electronics">Electronics</option>
                  <option value="clothing">Clothing</option>
                  <option value="foodstuff">Foodstuff</option>
                  <option value="pharmaceuticals">Pharmaceuticals</option>
                  <option value="fragile">Fragile Items</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Fragility Level *</label>
                <select
                  name="fragility"
                  value={formData.fragility}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  <option value="normal">Normal</option>
                  <option value="fragile">Fragile (+30%)</option>
                  <option value="very_fragile">Very Fragile (+50%)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Weight (kg) *</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0.1"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent ${
                    errors.weight ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., 2.5"
                />
                {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Distance (km) *</label>
              <input
                type="number"
                name="distance"
                value={formData.distance}
                onChange={handleInputChange}
                step="0.1"
                min="0.1"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent ${
                  errors.distance ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Enter approximate distance in kilometers"
              />
              {errors.distance && <p className="text-red-500 text-sm mt-1">{errors.distance}</p>}
              <p className="text-sm text-slate-600 mt-1">
                Tip: Use Google Maps to calculate the distance between pickup and delivery locations
              </p>
            </div>

            {/* Special Requirements for Cold Chain */}
            {serviceType === 'cold_chain' && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    name="temperatureControlled"
                    checked={formData.temperatureControlled}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-slate-700">Requires temperature control</label>
                </div>
                
                {formData.temperatureControlled && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Temperature Range</label>
                    <select
                      name="temperatureRange"
                      value={formData.temperatureRange}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    >
                      <option value="">Select temperature range</option>
                      <option value="2-8°C">2°C to 8°C (Pharmaceuticals)</option>
                      <option value="-18°C">-18°C (Frozen goods)</option>
                      <option value="15-25°C">15°C to 25°C (Room temperature)</option>
                      <option value="custom">Custom range</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Special Instructions</label>
              <textarea
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="Any special handling instructions..."
              />
            </div>
          </div>

          {/* Pricing Information */}
          {pricing && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Pricing Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Base rate (KSh {pricing.baseRatePerKm}/km × {formData.distance}km):</span>
                  <span>KSh {(pricing.baseRatePerKm * parseFloat(formData.distance || 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service multiplier ({(pricing.serviceMultiplier * 100 - 100).toFixed(0)}%):</span>
                  <span>×{pricing.serviceMultiplier}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fragility multiplier ({(pricing.fragililtyMultiplier * 100 - 100).toFixed(0)}%):</span>
                  <span>×{pricing.fragililtyMultiplier}</span>
                </div>
                <div className="flex justify-between">
                  <span>Weight multiplier ({(pricing.weightMultiplier * 100 - 100).toFixed(0)}%):</span>
                  <span>×{pricing.weightMultiplier}</span>
                </div>
                <hr className="border-green-300" />
                <div className="flex justify-between font-bold text-lg text-green-800">
                  <span>Total Cost:</span>
                  <span>KSh {pricing.totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !pricing}
              className="px-6 py-2 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-lg hover:from-slate-600 hover:to-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Order...' : `Book Now - KSh ${pricing ? pricing.totalCost.toFixed(2) : '0'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SpecialDeliveryBooking
