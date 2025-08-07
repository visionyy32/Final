import { supabase } from '../lib/supabase'

// Authentication functions
export const authService = {
  // Sign up with email and password
  async signUp(email, password, name, phone, role = 'user') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          role
        }
      }
    })
    return { data, error }
  },

  // Sign in with email and password
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Get user profile from public.users table
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      // If user profile doesn't exist, create one
      if (error && error.code === 'PGRST116') {
        console.log('User profile not found, creating one...')
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert([{
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email,
              phone: user.user_metadata?.phone || null,
              role: 'user'
            }])
            .select()
            .single()
          
          if (createError) {
            console.error('Error creating user profile:', createError)
            return { data: null, error: createError }
          }
          
          return { data: newProfile, error: null }
        }
      }
      
      return { data, error }
    } catch (error) {
      console.error('Error in getUserProfile:', error)
      return { data: null, error }
    }
  },

  // Update user profile
  async updateUserProfile(userId, profileData) {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        ...profileData, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId)
      .select()
      .single()
    return { data, error }
  }
}

// Parcel functions
export const parcelService = {
  // Get all parcels for current user
  async getUserParcels() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: [], error: null }
    }

    const { data, error } = await supabase
      .from('parcels')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20) // Limit to prevent slow queries
    return { data, error }
  },

  // Get all parcels (admin only)
  async getAllParcels() {
    const { data, error } = await supabase
      .from('parcels')
      .select(`
        *,
        users (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Create new parcel
  async createParcel(parcelData) {
    const { data, error } = await supabase
      .from('parcels')
      .insert([parcelData])
      .select('*')
      .single()
    return { data, error }
  },

  // Update parcel status
  async updateParcelStatus(parcelId, status) {
    const { data, error } = await supabase
      .from('parcels')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', parcelId)
      .select()
      .single()
    return { data, error }
  },

  // Cancel parcel (user can only cancel their own parcels in 'Pending Pickup' status)
  async cancelParcel(parcelId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: { message: 'User not authenticated' } }
    }

    // First check if the parcel belongs to the user and is in 'Pending Pickup' status
    const { data: parcel, error: fetchError } = await supabase
      .from('parcels')
      .select('*')
      .eq('id', parcelId)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      return { data: null, error: fetchError }
    }

    if (!parcel) {
      return { data: null, error: { message: 'Parcel not found or access denied' } }
    }

    if (parcel.status !== 'Pending Pickup') {
      return { data: null, error: { message: 'Can only cancel parcels that are pending pickup' } }
    }

    // Update status to 'Cancelled'
    const { data, error } = await supabase
      .from('parcels')
      .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
      .eq('id', parcelId)
      .select()
      .single()
    
    return { data, error }
  },

  // Get parcel by tracking number
  async getParcelByTracking(trackingNumber) {
    const { data, error } = await supabase
      .from('parcels')
      .select('*')
      .eq('tracking_number', trackingNumber)
      .single()
    return { data, error }
  }
}

// Support messages functions
export const supportService = {
  // Get all support messages (admin only)
  async getAllSupportMessages() {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Create support message
  async createSupportMessage(messageData) {
    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
    const insertData = {
      ...messageData,
      user_id: user?.id || null
      // Note: source column doesn't exist in the database yet
    }
    
    console.log('Inserting support message:', insertData)
    
    // Try insert without authentication first (for anonymous users)
    let { data, error } = await supabase
      .from('support_messages')
      .insert([insertData])
    
    if (error) {
      console.error('Supabase error details:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      
      // If it's a permissions error, try with explicit user_id
      if (error.code === 'PGRST301' || error.message?.includes('permission')) {
        console.log('Trying with explicit user_id...')
        const retryData = {
          ...messageData,
          user_id: null // Explicitly set to null for anonymous users
          // Note: source column doesn't exist in the database yet
        }
        
        const retryResult = await supabase
          .from('support_messages')
          .insert([retryData])
        
        if (retryResult.error) {
          console.error('Retry error:', retryResult.error)
        }
        
        return retryResult
      }
    }
    
    return { data, error }
  },

  // Update support message status
  async updateSupportMessageStatus(messageId, status, adminResponse = null) {
    const updateData = { 
      status, 
      updated_at: new Date().toISOString() 
    }
    if (adminResponse) {
      updateData.admin_response = adminResponse
    }
    
    const { data, error } = await supabase
      .from('support_messages')
      .update(updateData)
      .eq('id', messageId)
      .select()
      .single()
    return { data, error }
  }
}

// Chat functions
export const chatService = {
  // Get chat messages for a session
  async getChatMessages(sessionId) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        users (
          id,
          name,
          email
        )
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
    return { data, error }
  },

  // Send chat message
  async sendChatMessage(messageData) {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{
        user_id: messageData.user_id || user?.id || null,
        session_id: messageData.session_id,
        sender_name: messageData.sender_name,
        message: messageData.message,
        is_admin: messageData.is_admin || false
      }])
      .select(`
        *,
        users (
          id,
          name,
          email
        )
      `)
      .single()
    return { data, error }
  },

  // Get all chat sessions (admin only) - gets unique user sessions with latest message
  async getAllChatSessions() {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        session_id,
        user_id,
        sender_name,
        message,
        is_admin,
        created_at,
        users (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) return { data: null, error }
    
    // Group by session_id and get the latest message for each session
    const sessionsMap = new Map()
    data.forEach(msg => {
      if (!sessionsMap.has(msg.session_id)) {
        sessionsMap.set(msg.session_id, {
          session_id: msg.session_id,
          user_id: msg.user_id,
          user_name: msg.users?.name || msg.sender_name,
          user_email: msg.users?.email || 'Unknown',
          latest_message: msg.message,
          latest_message_time: msg.created_at,
          is_latest_from_admin: msg.is_admin,
          unread_count: 0 // We'll calculate this separately if needed
        })
      }
    })
    
    return { data: Array.from(sessionsMap.values()), error: null }
  },

  // Get or create chat session for a user
  async getOrCreateUserChatSession(userId, userName) {
    const sessionId = `user_${userId}`
    
    // Check if session exists
    const { data: existingMessages } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('session_id', sessionId)
      .limit(1)
    
    // If no messages exist, create a welcome message from admin
    if (!existingMessages || existingMessages.length === 0) {
      await supabase
        .from('chat_messages')
        .insert([{
          user_id: null, // Admin message
          session_id: sessionId,
          sender_name: 'TrackFlow Support',
          message: `Hello ${userName}! 👋 Welcome to TrackFlow Support. How can I help you today?`,
          is_admin: true
        }])
    }
    
    return { sessionId, error: null }
  },

  // Mark messages as read (for future implementation)
  async markMessagesAsRead(sessionId) {
    // This would require adding a 'read_at' field to the messages table
    // For now, we'll just return success
    console.log('markMessagesAsRead called for session:', sessionId)
    return { success: true }
  },

  // Get unread message count for a session
  async getUnreadCount(sessionId) {
    // This would require tracking read status
    // For now, return 0
    console.log('getUnreadCount called for session:', sessionId)
    return { count: 0, error: null }
  },

  // Delete a chat session (admin only)
  async deleteChatSession(sessionId) {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId)
    return { error }
  }
}

// User management functions (admin only)
export const userService = {
  // Get all users
  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Update user role
  async updateUserRole(userId, role) {
    const { data, error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()
    return { data, error }
  },

  // Delete user
  async deleteUser(userId) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
    return { error }
  }
}

// Admin logs functions
export const adminLogService = {
  // Create admin log
  async createAdminLog(action, details = {}) {
    const { data, error } = await supabase
      .from('admin_logs')
      .insert([{
        action,
        details
      }])
      .select()
      .single()
    return { data, error }
  },

  // Get admin logs
  async getAdminLogs() {
    const { data, error } = await supabase
      .from('admin_logs')
      .select(`
        *,
        users (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
    return { data, error }
  }
}

// Real-time subscriptions
export const realtimeService = {
  // Subscribe to parcel updates
  subscribeToParcels(callback) {
    return supabase
      .channel('parcels')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'parcels' 
      }, callback)
      .subscribe()
  },

  // Subscribe to support messages
  subscribeToSupportMessages(callback) {
    return supabase
      .channel('support_messages')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'support_messages' 
      }, callback)
      .subscribe()
  },

  // Subscribe to chat messages
  subscribeToChatMessages(callback) {
    return supabase
      .channel('chat_messages')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_messages' 
      }, callback)
      .subscribe()
  }
} 