import { useState, useEffect } from 'react'
import { quotesService } from '../services/quotesService'

const InternationalShippingBooking = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    cargoType: '',
    description: '',
    weight: '',
    distance: '',
    transportMethod: 'sea',
    originCountry: '',
    destinationCountry: '',
    pickupLocation: '',
    deliveryLocation: '',
    senderName: '',
    senderPhone: '',
    senderEmail: '',
    recipientName: '',
    recipientPhone: '',
    urgency: 'standard',
    customsValue: '',
    specialInstructions: ''
  })

  const [pricing, setPricing] = useState({
    cargoRate: 0,
    distanceRate: 0,
    baseCost: 0,
    transportMultiplier: 1.0,
    totalCost: 0
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  // Cargo types with pricing
  const cargoTypes = [
    {
      value: 'hard_cargo',
      label: 'Hard Cargo',
      description: 'Cars, machinery, heavy equipment, industrial goods',
      cargoRate: 1430, // KSh per kg
      distanceRate: 140 // KSh per km
    },
    {
      value: 'small_electronics',
      label: 'Small Electronics',
      description: 'Phones, laptops, tablets, small devices',
      cargoRate: 700, // KSh per kg
      distanceRate: 200 // KSh per km
    },
    {
      value: 'documents',
      label: 'Documents & Papers',
      description: 'Legal documents, certificates, contracts',
      cargoRate: 700, // Same as small electronics
      distanceRate: 200
    },
    {
      value: 'textiles',
      label: 'Textiles & Clothing',
      description: 'Garments, fabrics, fashion items',
      cargoRate: 700,
      distanceRate: 200
    },
    {
      value: 'medical_supplies',
      label: 'Medical Supplies',
      description: 'Medical equipment, supplies (non-temperature controlled)',
      cargoRate: 1430, // Higher rate for medical
      distanceRate: 140
    }
  ]

  // Transport methods with multipliers
  const transportMethods = [
    {
      value: 'air',
      label: 'Air Freight',
      multiplier: 1.4, // 40% increase
      description: 'Fastest delivery, premium pricing',
      timeframe: '3-7 days'
    },
    {
      value: 'sea',
      label: 'Sea Freight',
      multiplier: 1.0, // No increase
      description: 'Cost-effective for large shipments',
      timeframe: '2-6 weeks'
    },
    {
      value: 'land',
      label: 'Land Transport',
      multiplier: 1.0, // No increase
      description: 'Regional shipping, reliable',
      timeframe: '1-3 weeks'
    },
    {
      value: 'multimodal',
      label: 'Multimodal',
      multiplier: 1.2, // 20% increase for complexity
      description: 'Combination of transport methods',
      timeframe: '1-4 weeks'
    }
  ]

  // Calculate pricing when relevant fields change
  useEffect(() => {
    if (formData.weight && formData.distance && formData.cargoType && formData.transportMethod) {
      const selectedCargo = cargoTypes.find(c => c.value === formData.cargoType)
      const selectedTransport = transportMethods.find(t => t.value === formData.transportMethod)
      
      if (selectedCargo && selectedTransport) {
        const weightCost = parseFloat(formData.weight) * selectedCargo.cargoRate
        const distanceCost = parseFloat(formData.distance) * selectedCargo.distanceRate
        const baseCost = weightCost + distanceCost
        const totalCost = baseCost * selectedTransport.multiplier

        setPricing({
          cargoRate: selectedCargo.cargoRate,
          distanceRate: selectedCargo.distanceRate,
          baseCost,
          transportMultiplier: selectedTransport.multiplier,
          totalCost
        })
      }
    } else {
      setPricing({
        cargoRate: 0,
        distanceRate: 0,
        baseCost: 0,
        transportMultiplier: 1.0,
        totalCost: 0
      })
    }
  }, [formData.weight, formData.distance, formData.cargoType, formData.transportMethod])

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

    if (!formData.cargoType) newErrors.cargoType = 'Cargo type is required'
    if (!formData.description) newErrors.description = 'Description is required'
    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      newErrors.weight = 'Valid weight is required'
    }
    if (!formData.distance || parseFloat(formData.distance) <= 0) {
      newErrors.distance = 'Valid distance is required'
    }
    if (!formData.transportMethod) newErrors.transportMethod = 'Transport method is required'
    if (!formData.originCountry) newErrors.originCountry = 'Origin country is required'
    if (!formData.destinationCountry) newErrors.destinationCountry = 'Destination country is required'
    if (!formData.pickupLocation) newErrors.pickupLocation = 'Pickup location is required'
    if (!formData.deliveryLocation) newErrors.deliveryLocation = 'Delivery location is required'
    if (!formData.senderName) newErrors.senderName = 'Sender name is required'
    if (!formData.senderPhone) newErrors.senderPhone = 'Sender phone is required'
    if (!formData.recipientName) newErrors.recipientName = 'Recipient name is required'
    if (!formData.recipientPhone) newErrors.recipientPhone = 'Recipient phone is required'
    if (!formData.customsValue || parseFloat(formData.customsValue) <= 0) {
      newErrors.customsValue = 'Valid customs value is required'
    }

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
      const quoteData = {
        serviceType: 'international_shipping',
        shipmentType: formData.cargoType,
        description: formData.description,
        productDescription: formData.description,
        weight: parseFloat(formData.weight),
        originCountry: formData.originCountry,
        destinationCountry: formData.destinationCountry,
        senderCountry: formData.originCountry,
        recipientCountry: formData.destinationCountry,
        pickupLocation: formData.pickupLocation,
        deliveryLocation: formData.deliveryLocation,
        senderName: formData.senderName,
        senderPhone: formData.senderPhone,
        senderEmail: formData.senderEmail,
        recipientName: formData.recipientName,
        recipientPhone: formData.recipientPhone,
        urgency: formData.urgency,
        declaredValue: parseFloat(formData.customsValue),
        customsDeclaration: formData.description,
        specialInstructions: formData.specialInstructions,
        totalCost: pricing.totalCost,
        pickupDate: new Date().toISOString().split('T')[0], // Today's date
        isCommercial: parseFloat(formData.customsValue) > 10000 // Assume commercial if value > 10k
      }

      const result = await quotesService.createQuote(quoteData)
      
      if (result.success) {
        onSuccess(result.data, result.quoteNumber, result.isGuest)
        onClose()
        // Reset form
        setFormData({
          cargoType: '',
          description: '',
          weight: '',
          distance: '',
          transportMethod: 'sea',
          originCountry: '',
          destinationCountry: '',
          pickupLocation: '',
          deliveryLocation: '',
          senderName: '',
          senderPhone: '',
          senderEmail: '',
          recipientName: '',
          recipientPhone: '',
          urgency: 'standard',
          customsValue: '',
          specialInstructions: ''
        })
      } else {
        alert(`Booking failed: ${result.error}`)
      }
    } catch (error) {
      console.error('International shipping booking error:', error)
      alert('Booking failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">International Shipping Booking</h2>
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
            Global shipping solutions for all types of cargo with competitive rates
          </p>
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 text-sm">💡 Pricing Structure</h4>
            <p className="text-blue-800 text-sm mt-1">
              <strong>Hard Cargo:</strong> KSh 1,430/kg + KSh 1,000/km • <strong>Electronics:</strong> KSh 700/kg + KSh 200/km • <strong>Air:</strong> +40%
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cargo Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cargo Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type of Cargo *
                </label>
                <div className="space-y-3">
                  {cargoTypes.map(cargo => (
                    <div key={cargo.value} className="flex items-start">
                      <input
                        type="radio"
                        id={cargo.value}
                        name="cargoType"
                        value={cargo.value}
                        checked={formData.cargoType === cargo.value}
                        onChange={handleInputChange}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor={cargo.value} className="ml-3 cursor-pointer">
                        <div className="font-medium text-gray-900">{cargo.label}</div>
                        <div className="text-sm text-gray-600">{cargo.description}</div>
                        <div className="text-sm font-semibold text-green-600">
                          KSh {cargo.cargoRate.toLocaleString()}/kg + KSh {cargo.distanceRate.toLocaleString()}/km
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
                {errors.cargoType && <p className="text-red-500 text-sm mt-2">{errors.cargoType}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
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

                <div>
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
                    placeholder="Distance between countries"
                  />
                  {errors.distance && <p className="text-red-500 text-sm mt-1">{errors.distance}</p>}
                </div>
              </div>

              <div>
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
                  placeholder="Detailed description of the cargo for customs and handling"
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customs Value (KSh) *
                </label>
                <input
                  type="number"
                  name="customsValue"
                  value={formData.customsValue}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0.01"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.customsValue ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Value for customs declaration"
                />
                {errors.customsValue && <p className="text-red-500 text-sm mt-1">{errors.customsValue}</p>}
              </div>
            </div>
          </div>

          {/* Transport Method */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transport Method</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {transportMethods.map(method => (
                <div key={method.value} className="flex items-start p-3 border rounded-lg bg-white">
                  <input
                    type="radio"
                    id={method.value}
                    name="transportMethod"
                    value={method.value}
                    checked={formData.transportMethod === method.value}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor={method.value} className="ml-3 cursor-pointer flex-1">
                    <div className="font-medium text-gray-900">{method.label}</div>
                    <div className="text-sm text-gray-600">{method.description}</div>
                    <div className="text-sm text-blue-600">Timeframe: {method.timeframe}</div>
                    <div className="text-sm font-semibold text-orange-600">
                      {method.multiplier > 1 ? `+${((method.multiplier - 1) * 100).toFixed(0)}% surcharge` : 'Standard rate'}
                    </div>
                  </label>
                </div>
              ))}
            </div>
            {errors.transportMethod && <p className="text-red-500 text-sm mt-2">{errors.transportMethod}</p>}
          </div>

          {/* Location Details */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Origin Country *
                </label>
                <input
                  type="text"
                  name="originCountry"
                  value={formData.originCountry}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.originCountry ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Country of origin"
                />
                {errors.originCountry && <p className="text-red-500 text-sm mt-1">{errors.originCountry}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination Country *
                </label>
                <input
                  type="text"
                  name="destinationCountry"
                  value={formData.destinationCountry}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.destinationCountry ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Destination country"
                />
                {errors.destinationCountry && <p className="text-red-500 text-sm mt-1">{errors.destinationCountry}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
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
                  placeholder="Full pickup address"
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
                  placeholder="Full delivery address"
                />
                {errors.deliveryLocation && <p className="text-red-500 text-sm mt-1">{errors.deliveryLocation}</p>}
              </div>
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
                    placeholder="+1 234 567 8900"
                  />
                  {errors.recipientPhone && <p className="text-red-500 text-sm mt-1">{errors.recipientPhone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions (Optional)
                </label>
                <textarea
                  name="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any special handling instructions, customs notes, or requirements"
                />
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          {pricing.totalCost > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing Breakdown</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Weight Cost ({formData.weight}kg × KSh {pricing.cargoRate.toLocaleString()}/kg):</span>
                  <span className="font-medium">KSh {(parseFloat(formData.weight || 0) * pricing.cargoRate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Distance Cost ({formData.distance}km × KSh {pricing.distanceRate.toLocaleString()}/km):</span>
                  <span className="font-medium">KSh {(parseFloat(formData.distance || 0) * pricing.distanceRate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Base Cost:</span>
                  <span className="font-medium">KSh {pricing.baseCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transport Method Multiplier:</span>
                  <span className="font-medium">{pricing.transportMultiplier}x</span>
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
              {isSubmitting ? 'Booking...' : `Book International Shipping - KSh ${pricing.totalCost.toLocaleString()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InternationalShippingBooking
