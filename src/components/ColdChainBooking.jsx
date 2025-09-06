import { useState, useEffect } from 'react'
import { specialDeliveryService } from '../services/specialDeliveryService'

const ColdChainBooking = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    shipmentType: '',
    description: '',
    weight: '',
    distance: '',
    temperatureType: '',
    pickupLocation: '',
    deliveryLocation: '',
    senderName: '',
    senderPhone: '',
    senderEmail: '',
    recipientName: '',
    recipientPhone: '',
    urgency: 'standard'
  })

  const [pricing, setPricing] = useState({
    baseRate: 0,
    multiplier: 0,
    totalCost: 0
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  // Cold chain shipment types
  const shipmentTypes = [
    { value: 'vaccines', label: 'Vaccines' },
    { value: 'blood_products', label: 'Blood Products' },
    { value: 'organs', label: 'Organs/Tissues' },
    { value: 'pharmaceuticals', label: 'Pharmaceuticals' },
    { value: 'fresh_food', label: 'Fresh Food' },
    { value: 'frozen_food', label: 'Frozen Food' },
    { value: 'dairy', label: 'Dairy Products' },
    { value: 'chemicals', label: 'Temperature-Sensitive Chemicals' },
    { value: 'other', label: 'Other Cold Chain Items' }
  ]

  // Temperature categories with pricing multipliers
  const temperatureTypes = [
    { 
      value: 'pharmaceutical', 
      label: 'Pharmaceutical Grade (2-8°C)', 
      multiplier: 1.6, // 60% increase
      description: 'Ultra-precise temperature control for medications' 
    },
    { 
      value: 'perishable', 
      label: 'Highly Perishable (0-2°C)', 
      multiplier: 1.6, // 60% increase
      description: 'Critical temperature maintenance for sensitive items' 
    },
    { 
      value: 'refrigerated', 
      label: 'Refrigerated (2-8°C)', 
      multiplier: 1.4, // 40% increase
      description: 'Standard refrigerated transport' 
    },
    { 
      value: 'frozen', 
      label: 'Frozen (-18°C to -25°C)', 
      multiplier: 1.5, // 50% increase for frozen
      description: 'Frozen storage and transport' 
    }
  ]

  // Calculate pricing when relevant fields change
  useEffect(() => {
    if (formData.weight && formData.temperatureType) {
      const baseRatePerKg = 6000 // KSh 6000 per kg
      const selectedTempType = temperatureTypes.find(t => t.value === formData.temperatureType)
      const multiplier = selectedTempType ? selectedTempType.multiplier : 1
      
      const baseRate = parseFloat(formData.weight) * baseRatePerKg
      const totalCost = baseRate * multiplier

      setPricing({
        baseRate,
        multiplier,
        totalCost
      })
    } else {
      setPricing({ baseRate: 0, multiplier: 0, totalCost: 0 })
    }
  }, [formData.weight, formData.temperatureType])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.shipmentType) newErrors.shipmentType = 'Shipment type is required'
    if (!formData.description) newErrors.description = 'Description is required'
    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      newErrors.weight = 'Valid weight is required'
    }
    if (!formData.distance || parseFloat(formData.distance) <= 0) {
      newErrors.distance = 'Valid distance is required'
    }
    if (!formData.temperatureType) newErrors.temperatureType = 'Temperature type is required'
    if (!formData.pickupLocation) newErrors.pickupLocation = 'Pickup location is required'
    if (!formData.deliveryLocation) newErrors.deliveryLocation = 'Delivery location is required'
    if (!formData.senderName) newErrors.senderName = 'Sender name is required'
    if (!formData.senderPhone) newErrors.senderPhone = 'Sender phone is required'
    if (!formData.recipientName) newErrors.recipientName = 'Recipient name is required'
    if (!formData.recipientPhone) newErrors.recipientPhone = 'Recipient phone is required'

    // Email validation (optional but if provided, must be valid)
    if (formData.senderEmail && !/\S+@\S+\.\S+/.test(formData.senderEmail)) {
      newErrors.senderEmail = 'Valid email is required'
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
      const orderData = {
        serviceType: 'cold_chain',
        shipmentType: formData.shipmentType,
        productDescription: formData.description,
        weight: parseFloat(formData.weight),
        distance: parseFloat(formData.distance),
        temperatureType: formData.temperatureType,
        pickupLocation: formData.pickupLocation,
        deliveryLocation: formData.deliveryLocation,
        senderName: formData.senderName,
        senderPhone: formData.senderPhone,
        senderEmail: formData.senderEmail,
        recipientName: formData.recipientName,
        recipientPhone: formData.recipientPhone,
        urgency: formData.urgency,
        specialInstructions: `Cold Chain - ${temperatureTypes.find(t => t.value === formData.temperatureType)?.label}`,
        totalCost: pricing.totalCost
      }

      const result = await specialDeliveryService.createOrder(orderData)
      
      if (result.success) {
        onSuccess(result.data, result.orderNumber, result.isGuest)
        onClose()
        // Reset form
        setFormData({
          shipmentType: '',
          description: '',
          weight: '',
          distance: '',
          temperatureType: '',
          pickupLocation: '',
          deliveryLocation: '',
          senderName: '',
          senderPhone: '',
          senderEmail: '',
          recipientName: '',
          recipientPhone: '',
          urgency: 'standard'
        })
      } else {
        alert(`Booking failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Cold chain booking error:', error)
      alert('Booking failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Cold Chain Logistics Booking</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 mt-2">
              Specialized transport for temperature-sensitive cargo requiring precise climate control
            </p>
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 text-sm">💡 Pricing Information</h4>
              <p className="text-blue-800 text-sm mt-1">
                Base rate: <strong>KSh 6,000 per kg</strong> • Pharmaceutical/Perishable: <strong>+60%</strong> • Refrigerated: <strong>+40%</strong> • Frozen: <strong>+50%</strong>
              </p>
            </div>
          </div>        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Shipment Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipment Information</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type of Shipment *
                </label>
                <select
                  name="shipmentType"
                  value={formData.shipmentType}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.shipmentType ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select shipment type</option>
                  {shipmentTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.shipmentType && <p className="text-red-500 text-sm mt-1">{errors.shipmentType}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg) *
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0.1"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.weight ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter weight in kg"
                />
                {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cargo Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Detailed description of the cargo and any special handling requirements"
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
          </div>

          {/* Temperature Requirements */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Temperature Requirements</h3>
            
            <div className="space-y-3">
              {temperatureTypes.map(tempType => (
                <div key={tempType.value} className="flex items-start">
                  <input
                    type="radio"
                    id={tempType.value}
                    name="temperatureType"
                    value={tempType.value}
                    checked={formData.temperatureType === tempType.value}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor={tempType.value} className="ml-3 cursor-pointer">
                    <div className="font-medium text-gray-900">{tempType.label}</div>
                    <div className="text-sm text-gray-600">{tempType.description}</div>
                    <div className="text-sm font-semibold text-green-600">
                      Cost Multiplier: {((tempType.multiplier - 1) * 100).toFixed(0)}% additional
                    </div>
                  </label>
                </div>
              ))}
            </div>
            {errors.temperatureType && <p className="text-red-500 text-sm mt-2">{errors.temperatureType}</p>}
          </div>

          {/* Location Details */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Location *
                </label>
                <input
                  type="text"
                  name="pickupLocation"
                  value={formData.pickupLocation}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.pickupLocation ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Pickup address"
                />
                {errors.pickupLocation && <p className="text-red-500 text-sm mt-1">{errors.pickupLocation}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Location *
                </label>
                <input
                  type="text"
                  name="deliveryLocation"
                  value={formData.deliveryLocation}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.deliveryLocation ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Delivery address"
                />
                {errors.deliveryLocation && <p className="text-red-500 text-sm mt-1">{errors.deliveryLocation}</p>}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Distance (km) *
              </label>
              <input
                type="number"
                name="distance"
                value={formData.distance}
                onChange={handleInputChange}
                step="0.1"
                min="0.1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.distance ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Distance between pickup and delivery"
              />
              {errors.distance && <p className="text-red-500 text-sm mt-1">{errors.distance}</p>}
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sender Name *
                  </label>
                  <input
                    type="text"
                    name="senderName"
                    value={formData.senderName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.senderName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Sender full name"
                  />
                  {errors.senderName && <p className="text-red-500 text-sm mt-1">{errors.senderName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sender Phone *
                  </label>
                  <input
                    type="tel"
                    name="senderPhone"
                    value={formData.senderPhone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.senderPhone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+254 712 345 678"
                  />
                  {errors.senderPhone && <p className="text-red-500 text-sm mt-1">{errors.senderPhone}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sender Email (Optional)
                  </label>
                  <input
                    type="email"
                    name="senderEmail"
                    value={formData.senderEmail}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.senderEmail ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="sender@email.com"
                  />
                  {errors.senderEmail && <p className="text-red-500 text-sm mt-1">{errors.senderEmail}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level
                  </label>
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="urgent">Urgent</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.recipientName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Recipient full name"
                  />
                  {errors.recipientName && <p className="text-red-500 text-sm mt-1">{errors.recipientName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Phone *
                  </label>
                  <input
                    type="tel"
                    name="recipientPhone"
                    value={formData.recipientPhone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.recipientPhone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+254 712 345 678"
                  />
                  {errors.recipientPhone && <p className="text-red-500 text-sm mt-1">{errors.recipientPhone}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          {pricing.totalCost > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Base Rate ({formData.weight}kg × KSh 6,000/kg):</span>
                  <span className="font-medium">KSh {pricing.baseRate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Temperature Control Multiplier:</span>
                  <span className="font-medium">{pricing.multiplier}x</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Total Cost:</span>
                  <span className="text-blue-600">KSh {pricing.totalCost.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || pricing.totalCost === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Booking...' : `Book Cold Chain Service - KSh ${pricing.totalCost.toLocaleString()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ColdChainBooking
