import { supabase } from '../lib/supabase'

export const quotesService = {
  // Generate unique quote number
  generateQuoteNumber: () => {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `QT-${dateStr}-${random}`
  },

  // Create quote for cold chain or international shipping
  createQuote: async (quoteData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Allow both authenticated and guest users
      let userId = null
      if (user) {
        userId = user.id
      }

      // Generate quote number
      const quoteNumber = quotesService.generateQuoteNumber()
      
      // Map form data to database schema
      const quoteToInsert = {
        quote_number: quoteNumber,
        user_id: userId, // Can be null for guest users
        service_type: quoteData.serviceType,
        
        // Sender information
        sender_name: quoteData.senderName,
        sender_email: quoteData.senderEmail,
        sender_phone: quoteData.senderPhone,
        sender_address: quoteData.senderAddress || quoteData.pickupLocation,
        sender_city: quoteData.senderCity || 'Nairobi', // Default city
        sender_country: quoteData.senderCountry || quoteData.originCountry || 'Kenya',
        
        // Recipient information
        recipient_name: quoteData.recipientName,
        recipient_email: quoteData.recipientEmail || null,
        recipient_phone: quoteData.recipientPhone,
        recipient_address: quoteData.recipientAddress || quoteData.deliveryLocation,
        recipient_city: quoteData.recipientCity || quoteData.destinationCity || 'Unknown',
        recipient_country: quoteData.recipientCountry || quoteData.destinationCountry || 'Kenya',
        
        // Package details
        package_description: quoteData.productDescription || quoteData.description,
        package_type: quoteData.productType || quoteData.shipmentType || 'other',
        weight_kg: parseFloat(quoteData.weight),
        dimensions_length_cm: quoteData.length ? parseFloat(quoteData.length) : null,
        dimensions_width_cm: quoteData.width ? parseFloat(quoteData.width) : null,
        dimensions_height_cm: quoteData.height ? parseFloat(quoteData.height) : null,
        declared_value: quoteData.declaredValue ? parseFloat(quoteData.declaredValue) : null,
        
        // Service-specific fields
        temperature_requirement: quoteData.temperatureType || null,
        temperature_sensitive: quoteData.temperatureType ? true : false,
        customs_declaration: quoteData.customsDeclaration || null,
        hs_code: quoteData.hsCode || null,
        is_commercial: quoteData.isCommercial || false,
        
        // Shipping preferences
        pickup_date: quoteData.pickupDate || new Date().toISOString().split('T')[0],
        preferred_pickup_time: quoteData.preferredTime || null,
        delivery_urgency: quoteData.urgency || 'standard',
        insurance_required: quoteData.insuranceRequired || false,
        special_handling_instructions: quoteData.specialInstructions || null,
        
        // Quote information
        estimated_cost: quoteData.totalCost ? parseFloat(quoteData.totalCost) : null,
        status: 'pending'
      }

      const { data, error } = await supabase
        .from('quotes')
        .insert([quoteToInsert])
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        throw error
      }

      return { 
        success: true, 
        data, 
        quoteNumber, 
        isGuest: !user 
      }
    } catch (error) {
      console.error('Error creating quote:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to create quote' 
      }
    }
  },

  // Get user's quotes
  getUserQuotes: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error fetching user quotes:', error)
      return { success: false, error: error.message }
    }
  },

  // Get all quotes (Admin only)
  getAllQuotes: async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error fetching all quotes:', error)
      return { success: false, error: error.message }
    }
  },

  // Update quote status
  updateQuoteStatus: async (quoteId, status, additionalData = {}) => {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData
      }

      const { data, error } = await supabase
        .from('quotes')
        .update(updateData)
        .eq('id', quoteId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error updating quote status:', error)
      return { success: false, error: error.message }
    }
  },

  // Get quote by quote number (for tracking)
  getQuoteByNumber: async (quoteNumber) => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('quote_number', quoteNumber)
        .single()

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error fetching quote by number:', error)
      return { success: false, error: error.message }
    }
  }
}
