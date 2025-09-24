import { supabase } from '../lib/supabase'

export const expressDeliveryService = {
  // Generate unique order number
  generateOrderNumber: () => {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `EXP-${dateStr}-${random}`
  },

  // Generate tracking number
  generateTrackingNumber: () => {
    const prefix = 'TF'
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${prefix}${timestamp}${random}`
  },

  // Calculate express delivery pricing
  calculatePricing: (weight, distance, expressType, fragileHandling = false, insuranceRequired = false, declaredValue = 0) => {
    const baseRatePerKm = 45.00 // KSh 45 per km
    const baseRatePerKg = 100.00 // KSh 100 per kg for express
    
    // Express type multipliers
    const expressMultipliers = {
      'standard': 1.0,
      'same_day': 2.0,    // 100% surcharge
      'next_day': 1.5,    // 50% surcharge
      'two_day': 1.2      // 20% surcharge
    }
    
    const expressMultiplier = expressMultipliers[expressType] || 1.0
    
    // Base cost calculation
    const weightCost = weight * baseRatePerKg
    const distanceCost = distance * baseRatePerKm
    const baseCost = (weightCost + distanceCost) * expressMultiplier
    
    // Additional charges
    let expressSurcharge = baseCost * (expressMultiplier - 1)
    let fragileCharge = fragileHandling ? baseCost * 0.15 : 0 // 15% for fragile
    let insuranceCost = insuranceRequired ? Math.max(declaredValue * 0.02, 500) : 0 // 2% of value, min KSh 500
    
    const totalCost = baseCost + fragileCharge + insuranceCost
    
    return {
      baseCost,
      expressSurcharge,
      fragileCharge,
      insuranceCost,
      totalCost,
      breakdown: {
        weightCost,
        distanceCost,
        expressMultiplier,
        fragileCharge,
        insuranceCost
      }
    }
  },

  // Create express delivery order
  createOrder: async (orderData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Allow both authenticated and guest users
      let userId = null
      if (user) {
        userId = user.id
      }

      // Generate order and tracking numbers
      const orderNumber = expressDeliveryService.generateOrderNumber()
      const trackingNumber = expressDeliveryService.generateTrackingNumber()
      
      // Calculate pricing
      const pricing = expressDeliveryService.calculatePricing(
        orderData.weight,
        orderData.distance,
        orderData.expressType,
        orderData.fragileHandling,
        orderData.insuranceRequired,
        orderData.declaredValue
      )

      const orderToInsert = {
        order_number: orderNumber,
        tracking_number: trackingNumber,
        user_id: userId, // Can be null for guest users
        
        // Contact information
        sender_name: orderData.senderName,
        sender_email: orderData.senderEmail || null,
        sender_phone: orderData.senderPhone,
        sender_address: orderData.senderAddress || orderData.pickupLocation,
        sender_city: orderData.senderCity || 'Nairobi',
        sender_country: orderData.senderCountry || 'Kenya',
        
        recipient_name: orderData.recipientName,
        recipient_email: orderData.recipientEmail || null,
        recipient_phone: orderData.recipientPhone,
        recipient_address: orderData.recipientAddress || orderData.deliveryLocation,
        recipient_city: orderData.recipientCity || orderData.destinationCity || 'Unknown',
        recipient_country: orderData.recipientCountry || orderData.destinationCountry || 'Kenya',
        
        // Package details
        package_description: orderData.productDescription || orderData.description,
        package_type: orderData.productType || orderData.packageType || 'other',
        package_category: orderData.packageCategory || 'general',
        weight_kg: parseFloat(orderData.weight),
        dimensions_length_cm: orderData.length ? parseFloat(orderData.length) : null,
        dimensions_width_cm: orderData.width ? parseFloat(orderData.width) : null,
        dimensions_height_cm: orderData.height ? parseFloat(orderData.height) : null,
        declared_value: orderData.declaredValue ? parseFloat(orderData.declaredValue) : null,
        
        // Delivery preferences
        pickup_date: orderData.pickupDate || new Date().toISOString().split('T')[0],
        preferred_pickup_time: orderData.preferredPickupTime || null,
        delivery_urgency: orderData.urgency || 'standard',
        delivery_time_preference: orderData.deliveryTimePreference || 'anytime',
        special_instructions: orderData.specialInstructions || null,
        
        // Service options
        insurance_required: orderData.insuranceRequired || false,
        signature_required: orderData.signatureRequired !== false, // Default true
        fragile_handling: orderData.fragileHandling || false,
        express_type: orderData.expressType || 'standard',
        
        // Pricing information
        distance_km: orderData.distance ? parseFloat(orderData.distance) : null,
        base_cost: pricing.baseCost,
        express_surcharge: pricing.expressSurcharge,
        insurance_cost: pricing.insuranceCost,
        total_cost: orderData.totalCost || pricing.totalCost,
        
        // Initial status
        status: 'pending'
      }

      const { data, error } = await supabase
        .from('express_delivery')
        .insert([orderToInsert])
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        throw error
      }

      return { 
        success: true, 
        data, 
        orderNumber, 
        trackingNumber,
        isGuest: !user 
      }
    } catch (error) {
      console.error('Error creating express delivery order:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to create express delivery order' 
      }
    }
  },

  // Get user's express delivery orders
  getUserOrders: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('express_delivery')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error fetching user express delivery orders:', error)
      return { success: false, error: error.message }
    }
  },

  // Get all express delivery orders (Admin only)
  getAllOrders: async () => {
    try {
      const { data, error } = await supabase
        .from('express_delivery')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error fetching all express delivery orders:', error)
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
        .from('express_delivery')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error updating express delivery order status:', error)
      return { success: false, error: error.message }
    }
  },

  // Track order by tracking number
  trackOrder: async (trackingNumber) => {
    try {
      const { data, error } = await supabase
        .from('express_delivery')
        .select('*')
        .eq('tracking_number', trackingNumber)
        .single()

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error tracking express delivery order:', error)
      return { success: false, error: error.message }
    }
  },

  // Get order by order number
  getOrderByNumber: async (orderNumber) => {
    try {
      const { data, error } = await supabase
        .from('express_delivery')
        .select('*')
        .eq('order_number', orderNumber)
        .single()

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error fetching express delivery order by number:', error)
      return { success: false, error: error.message }
    }
  }
}
