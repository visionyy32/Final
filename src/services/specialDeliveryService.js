import { supabase } from '../lib/supabase'
import { emailService } from './emailService'

export const specialDeliveryService = {
  // Calculate pricing based on distance, product type, and service type
  calculatePricing: (distance, productType, serviceType, weight, fragility, temperatureType = null, cargoType = null, transportMethod = null) => {
    // Special pricing for international shipping
    if (serviceType === 'international_shipping' && cargoType && transportMethod) {
      let cargoRatePerKg = 0
      let distanceRatePerKm = 0

      // Cargo type rates
      switch (cargoType) {
        case 'hard_cargo':
          cargoRatePerKg = 1430 // KSh 1430 per kg
          distanceRatePerKm = 140 // KSh 140 per km
          break
        case 'small_electronics':
          cargoRatePerKg = 700 // KSh 700 per kg
          distanceRatePerKm = 200 // KSh 200 per km
          break
        default:
          cargoRatePerKg = 1000 // Default rate
          distanceRatePerKm = 500 // Default rate
      }

      // Transport method multiplier
      let transportMultiplier = 1.0
      if (transportMethod === 'air') {
        transportMultiplier = 1.4 // 40% increase for air freight
      }

      const weightCost = weight * cargoRatePerKg
      const distanceCost = distance * distanceRatePerKm
      const baseCost = weightCost + distanceCost
      const totalCost = baseCost * transportMultiplier

      return {
        cargoRatePerKg,
        distanceRatePerKm,
        transportMultiplier,
        totalCost,
        breakdown: {
          weightCost,
          distanceCost,
          baseCost,
          transportAdjustment: baseCost * (transportMultiplier - 1),
          totalCost
        }
      }
    }

    // Special pricing for cold chain logistics
    if (serviceType === 'cold_chain' && temperatureType) {
      const baseRatePerKg = 6000 // KSh 6000 per kg for cold chain
      let temperatureMultiplier = 1.0

      // Temperature type multipliers
      switch (temperatureType) {
        case 'pharmaceutical':
          temperatureMultiplier = 1.6 // 60% increase
          break
        case 'perishable':
          temperatureMultiplier = 1.6 // 60% increase
          break
        case 'refrigerated':
          temperatureMultiplier = 1.4 // 40% increase
          break
        case 'frozen':
          temperatureMultiplier = 1.5 // 50% increase
          break
        default:
          temperatureMultiplier = 1.0
      }

      const totalCost = weight * baseRatePerKg * temperatureMultiplier
      return {
        baseRate: weight * baseRatePerKg,
        temperatureMultiplier,
        totalCost,
        breakdown: {
          weightCost: weight * baseRatePerKg,
          temperatureAdjustment: weight * baseRatePerKg * (temperatureMultiplier - 1),
          totalCost
        }
      }
    }

    // Original pricing logic for other services
    const baseRatePerKm = 45.00 // KSh 45 per km
    let serviceMultiplier = 1.0
    let fragililtyMultiplier = 1.0
    let weightMultiplier = 1.0
    
    // Service type multipliers
    switch (serviceType) {
      case 'express_delivery':
        serviceMultiplier = 1.5 // 50% premium for express
        break
      case 'cold_chain':
        serviceMultiplier = 2.0 // 100% premium for cold chain (fallback)
        break
      case 'international_shipping':
        serviceMultiplier = 3.0 // 200% premium for international
        break
      default:
        serviceMultiplier = 1.0
    }
    
    // Fragility multipliers
    switch (fragility) {
      case 'fragile':
        fragililtyMultiplier = 1.3 // 30% premium for fragile
        break
      case 'very_fragile':
        fragililtyMultiplier = 1.5 // 50% premium for very fragile
        break
      default:
        fragililtyMultiplier = 1.0
    }
    
    // Weight multipliers (above 10kg)
    if (weight > 10) {
      weightMultiplier = 1 + ((weight - 10) * 0.1) // 10% per kg above 10kg
    }
    
    // Product type considerations
    const productTypeMultipliers = {
      'electronics': 1.2,
      'pharmaceuticals': 1.4,
      'foodstuff': 1.1,
      'fragile': 1.3,
      'documents': 0.9,
      'clothing': 1.0,
      'other': 1.0
    }
    
    const productMultiplier = productTypeMultipliers[productType] || 1.0
    
    const totalCost = distance * baseRatePerKm * serviceMultiplier * fragililtyMultiplier * weightMultiplier * productMultiplier
    
    return {
      baseRatePerKm,
      serviceMultiplier,
      fragililtyMultiplier,
      weightMultiplier,
      productMultiplier,
      totalCost: Math.round(totalCost * 100) / 100 // Round to 2 decimal places
    }
  },

  // Generate unique order number
  generateOrderNumber: (serviceType) => {
    const prefix = {
      'express_delivery': 'EXP',
      'cold_chain': 'CC',
      'international_shipping': 'INT'
    }[serviceType] || 'SPD'
    
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    return `${prefix}${timestamp}${random}`
  },

  // Create special delivery order
  createOrder: async (orderData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Allow both authenticated and guest users
      let userId = null
      if (user) {
        userId = user.id
      }

      // Generate order number
      const orderNumber = specialDeliveryService.generateOrderNumber(orderData.serviceType)
      
      // Calculate pricing
      let pricing
      if (orderData.serviceType === 'cold_chain' && orderData.temperatureType) {
        // Use new cold chain pricing
        pricing = specialDeliveryService.calculatePricing(
          orderData.distance,
          orderData.productType,
          orderData.serviceType,
          orderData.weight,
          orderData.fragility,
          orderData.temperatureType
        )
      } else if (orderData.serviceType === 'international_shipping' && orderData.cargoType && orderData.transportMethod) {
        // Use international shipping pricing
        pricing = specialDeliveryService.calculatePricing(
          orderData.distance,
          orderData.productType,
          orderData.serviceType,
          orderData.weight,
          orderData.fragility,
          null, // temperatureType
          orderData.cargoType,
          orderData.transportMethod
        )
      } else {
        // Use original pricing for other services
        pricing = specialDeliveryService.calculatePricing(
          orderData.distance,
          orderData.productType,
          orderData.serviceType,
          orderData.weight,
          orderData.fragility
        )
      }

      const orderToInsert = {
        order_number: orderNumber,
        user_id: userId, // Can be null for guest users
        service_type: orderData.serviceType,
        sender_name: orderData.senderName,
        sender_address: orderData.senderAddress || orderData.pickupLocation,
        sender_phone: orderData.senderPhone,
        sender_email: orderData.senderEmail || null, // Store email for guest users
        recipient_name: orderData.recipientName,
        recipient_address: orderData.recipientAddress || orderData.deliveryLocation,
        recipient_phone: orderData.recipientPhone,
        pickup_date: orderData.pickupDate || new Date().toISOString().split('T')[0], // Default to today if not provided
        preferred_time: orderData.preferredTime,
        product_description: orderData.productDescription || orderData.description,
        product_type: orderData.productType || orderData.shipmentType,
        fragility_level: orderData.fragility || 'normal',
        weight_kg: orderData.weight,
        dimensions: orderData.dimensions ? JSON.stringify(orderData.dimensions) : null,
        temperature_controlled: orderData.temperatureType ? true : (orderData.temperatureControlled || false),
        temperature_range: orderData.temperatureType || orderData.temperatureRange || null,
        special_instructions: orderData.specialInstructions || null,
        distance_km: orderData.distance,
        pickup_location: orderData.pickupLocation || orderData.originCountry,
        delivery_location: orderData.deliveryLocation || orderData.destinationCountry,
        urgency: orderData.urgency || 'standard',
        total_cost: orderData.totalCost || pricing.totalCost,
        status: 'pending'
      }

      // Add international shipping specific fields
      if (orderData.serviceType === 'international_shipping') {
        orderToInsert.origin_country = orderData.originCountry
        orderToInsert.destination_country = orderData.destinationCountry
        orderToInsert.customs_value = orderData.customsValue
        orderToInsert.cargo_type = orderData.cargoType
        orderToInsert.transport_method = orderData.transportMethod
        orderToInsert.pickup_location = orderData.pickupLocation || `${orderData.originCountry} (International)`
        orderToInsert.delivery_location = orderData.deliveryLocation || `${orderData.destinationCountry} (International)`
      }

      // Add pricing details based on service type
      if (orderData.serviceType === 'cold_chain' && pricing.breakdown) {
        // For cold chain, use enhanced schema columns
        orderToInsert.temperature_controlled = true
        orderToInsert.temperature_range = `${orderData.temperatureType} (${pricing.temperatureMultiplier}x multiplier)`
        orderToInsert.temperature_type = orderData.temperatureType
        orderToInsert.base_rate_per_kg = 6000
        orderToInsert.temperature_multiplier = pricing.temperatureMultiplier
        orderToInsert.service_multiplier = pricing.temperatureMultiplier
        orderToInsert.base_rate_per_km = 45.00 // Keep for compatibility
        orderToInsert.fragility_multiplier = 1.0
        orderToInsert.weight_multiplier = 1.0
      } else if (orderData.serviceType === 'international_shipping' && pricing.breakdown) {
        // For international shipping, use new pricing structure
        orderToInsert.base_rate_per_kg = pricing.cargoRatePerKg
        orderToInsert.base_rate_per_km = pricing.distanceRatePerKm
        orderToInsert.service_multiplier = pricing.transportMultiplier
        orderToInsert.fragility_multiplier = 1.0
        orderToInsert.weight_multiplier = 1.0
        orderToInsert.transport_multiplier = pricing.transportMultiplier
        orderToInsert.cargo_rate_per_kg = pricing.cargoRatePerKg
        orderToInsert.distance_rate_per_km = pricing.distanceRatePerKm
      } else {
        // For other services, use original pricing structure
        orderToInsert.base_rate_per_km = pricing.baseRatePerKm || 45.00
        orderToInsert.fragility_multiplier = pricing.fragililtyMultiplier || 1.0
        orderToInsert.weight_multiplier = pricing.weightMultiplier || 1.0
        orderToInsert.service_multiplier = pricing.serviceMultiplier || 1.0
      }

      const { data, error } = await supabase
        .from('special_delivery_orders')
        .insert([orderToInsert])
        .select()
        .single()

      if (error) {
        throw error
      }

      // Send confirmation email if email is provided
      if (orderData.senderEmail) {
        try {
          const emailResult = await emailService.sendOrderConfirmationEmail(data)
          console.log('Email sent:', emailResult.success ? 'Success' : 'Failed')
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError)
          // Don't fail the order creation if email fails
        }
      }

      // Send SMS notification as backup
      try {
        const serviceNames = {
          'express_delivery': 'Express Delivery',
          'cold_chain': 'Cold Chain',
          'international_shipping': 'International Shipping'
        }
        const serviceName = serviceNames[orderData.serviceType] || 'Special Delivery'
        
        const smsResult = await emailService.sendSMSNotification(
          orderData.senderPhone,
          orderNumber,
          serviceName
        )
        console.log('SMS sent:', smsResult.success ? 'Success' : 'Failed')
      } catch (smsError) {
        console.error('Failed to send SMS notification:', smsError)
        // Don't fail the order creation if SMS fails
      }

      return { success: true, data, orderNumber, isGuest: !user }
    } catch (error) {
      console.error('Error creating special delivery order:', error)
      return { success: false, error: error.message }
    }
  },

  // Get user's orders
  getUserOrders: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('special_delivery_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error fetching user orders:', error)
      return { success: false, error: error.message }
    }
  },

  // Get all orders (Admin only)
  getAllOrders: async () => {
    try {
      const { data, error } = await supabase
        .from('special_delivery_orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error fetching all orders:', error)
      return { success: false, error: error.message }
    }
  },

  // Update order status
  updateOrderStatus: async (orderId, status, additionalData = {}) => {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData
      }

      const { data, error } = await supabase
        .from('special_delivery_orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error updating order status:', error)
      return { success: false, error: error.message }
    }
  }
}
