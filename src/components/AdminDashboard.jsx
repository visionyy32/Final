import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { userService, parcelService, supportService, chatService, adminLogService } from '../services/supabaseService'
import { specialDeliveryService } from '../services/specialDeliveryService'
import { supabase } from '../lib/supabase'

const AdminDashboard = ({ onSignOut }) => {
  // Debug logging
  console.log('AdminDashboard component mounting...')
  console.log('Services available:', { 
    userService: !!userService, 
    parcelService: !!parcelService, 
    supportService: !!supportService,
    chatService: !!chatService 
  })

  const [activeTab, setActiveTab] = useState('overview')
  // Remove hardcoded support messages - we'll load them from database
  const [supportMessages, setSupportMessages] = useState([])

  // State management
  const [users, setUsers] = useState([])
  const [parcels, setParcels] = useState([])
  const [contactSupportMessages, setContactSupportMessages] = useState([])
  const [liveChats, setLiveChats] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingParcels, setLoadingParcels] = useState(false)
  const [loadingSupport, setLoadingSupport] = useState(false)
  const [loadingChats, setLoadingChats] = useState(false)

  // Bookings state
  const [specialDeliveryOrders, setSpecialDeliveryOrders] = useState([])
  const [quoteRequests, setQuoteRequests] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [bookingsFilter, setBookingsFilter] = useState('all') // all, pending, confirmed, delivered
  const [quotesFilter, setQuotesFilter] = useState('all') // all, pending, resolved

  // Reply modal state
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [showEmailPreview, setShowEmailPreview] = useState(false)

  // Refs for subscription cleanup
  const chatSubscriptionRef = useRef(null)
  const chatListSubscriptionRef = useRef(null)

  // Predefined reply templates
  const replyTemplates = {
    'delivery-delay': `Thank you for bringing this to our attention. I apologize for the delay in your parcel delivery.

I have personally looked into your tracking number and coordinated with our delivery team to prioritize your package. Your parcel should be delivered within the next 24 hours.

We will also provide you with real-time SMS updates on the delivery status. As a gesture of goodwill for the inconvenience caused, we are applying a 15% discount to your next shipment.`,

    'tracking-issue': `I apologize for the difficulty you experienced with tracking your parcel.

I have verified your tracking number in our system and can confirm that your package is currently in transit. The tracking system had a temporary synchronization issue which has now been resolved.

Your parcel is expected to be delivered within 1-2 business days. You should now be able to track it normally using the same tracking number.`,

    'pricing-inquiry': `Thank you for your interest in our delivery services.

For a 5kg package from Nairobi to Mombasa:
- Standard Delivery (2-3 days): KES 800
- Express Delivery (Next day): KES 1,200
- Same Day Delivery: KES 1,800

These prices include insurance coverage up to KES 50,000. For bulk shipments or regular customers, we offer attractive discount packages.

Would you like me to process this shipment for you or provide more details about any of our services?`,

    'general': `Thank you for contacting TrackFlow support.

I have reviewed your inquiry and will be happy to assist you with this matter. Our team is committed to providing you with the best possible service and ensuring your complete satisfaction.

If you need any immediate assistance, please don't hesitate to call our customer service line at +254 714 468 611.`
  }

  // Calculate real-time stats
  const calculateStats = (parcelData) => {
    if (!Array.isArray(parcelData)) {
      return {
        totalParcels: 0,
        deliveredParcels: 0,
        pendingParcels: 0,
        cancelledParcels: 0,
        monthlyGrowth: 0
      }
    }

    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const stats = {
      totalParcels: parcelData.length,
      deliveredParcels: parcelData.filter(p => p.status === 'Delivered').length,
      pendingParcels: parcelData.filter(p => p.status === 'Pending Pickup' || p.status === 'In Transit').length,
      cancelledParcels: parcelData.filter(p => p.status === 'Cancelled').length,
      monthlyGrowth: parcelData.filter(p => new Date(p.created_at) >= thisMonth).length
    }

    return stats
  }

  // Generate recent activity from parcel data
  const generateRecentActivity = useCallback((parcelData) => {
    if (!Array.isArray(parcelData)) {
      return []
    }

    const activities = []
    
    // Add activities for new parcels
    parcelData.forEach(parcel => {
      if (parcel.status === 'Pending Pickup' || parcel.status === 'In Transit') {
        const timeAgo = getTimeAgo(new Date(parcel.created_at))
        activities.push({
          id: `new-${parcel.id}`,
          action: 'New parcel registered',
          details: `Parcel #${parcel.id} from ${parcel.sender_name || 'Unknown'} to ${parcel.recipient_name || 'Unknown'}`,
          time: timeAgo,
          type: 'new'
        })
      }
    })

    // Add activities for status updates
    parcelData.forEach(parcel => {
      if (parcel.status === 'Delivered' || parcel.status === 'In Transit') {
        const timeAgo = getTimeAgo(new Date(parcel.updated_at || parcel.created_at))
        activities.push({
          id: `update-${parcel.id}`,
          action: `Parcel ${parcel.status}`,
          details: `Parcel #${parcel.id} status updated to ${parcel.status}`,
          time: timeAgo,
          type: 'update'
        })
      }
    })

    // Sort by time (assuming more recent activities have smaller time values)
    return activities.sort((a, b) => {
      const timeA = a.time.includes('minute') ? parseInt(a.time) : 
                   a.time.includes('hour') ? parseInt(a.time) * 60 : 
                   parseInt(a.time) * 1440
      const timeB = b.time.includes('minute') ? parseInt(b.time) : 
                   b.time.includes('hour') ? parseInt(b.time) * 60 : 
                   parseInt(b.time) * 1440
      return timeA - timeB
    }).slice(0, 10) // Show only latest 10 activities
  }, [])

  const getTimeAgo = (date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }

  // Load overview data
  const loadOverviewData = async () => {
    setLoadingParcels(true)
    try {
      const { data, error } = await parcelService.getAllParcels()
      if (error) {
        console.error('Error loading overview data:', error)
      } else {
        setParcels(data || [])
      }
    } catch (error) {
      console.error('Error loading overview data:', error)
    } finally {
      setLoadingParcels(false)
    }
  }

  // Load chat sessions for admin
  const loadChatSessions = async () => {
    setLoadingChats(true)
    try {
      const { data, error } = await chatService.getAllChatSessions()
      if (error) {
        console.error('Error loading chat sessions:', error)
      } else {
        const transformedChats = data?.map(session => ({
          session_id: session.id,
          user_name: session.sender_name || 'Unknown User',
          user_email: session.sender_email || '',
          latest_message: session.message || 'No message',
          latest_message_time: session.created_at,
          is_latest_from_admin: session.is_admin || false,
          unread_count: 0
        })) || []
        setLiveChats(transformedChats)
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error)
    } finally {
      setLoadingChats(false)
    }
  }

  // Load bookings data (special delivery orders and quote requests)
  const loadBookingsData = async () => {
    setLoadingBookings(true)
    try {
      // Load special delivery orders
      const ordersResult = await specialDeliveryService.getAllOrders()
      if (ordersResult.success) {
        setSpecialDeliveryOrders(ordersResult.data || [])
      } else {
        console.error('Error loading special delivery orders:', ordersResult.error)
      }

      // Load support messages that might be quote requests
      const { data: supportData, error: supportError } = await supportService.getAllSupportMessages()
      if (supportError) {
        console.error('Error loading support messages for quotes:', supportError)
      } else {
        // Filter messages that might be quote requests
        const quoteMessages = supportData?.filter(msg => 
          msg.subject === 'general' || 
          msg.message?.toLowerCase().includes('quote') ||
          msg.message?.toLowerCase().includes('price') ||
          msg.message?.toLowerCase().includes('cost') ||
          msg.subject === 'partnership'
        ) || []
        setQuoteRequests(quoteMessages)
      }
    } catch (error) {
      console.error('Error loading bookings data:', error)
    } finally {
      setLoadingBookings(false)
    }
  }

  // Load messages for selected chat
  const loadChatMessages = async (sessionId) => {
    try {
      const { data: messages, error } = await chatService.getChatMessages(sessionId)
      if (error) {
        console.error('Error loading chat messages:', error)
        return
      }
      
      if (messages) {
        const formattedMessages = messages.map(msg => ({
          id: msg.id,
          sender: msg.is_admin ? 'Admin' : msg.sender_name || 'User',
          sender_name: msg.is_admin ? 'TrackFlow Support' : msg.sender_name,
          message: msg.message,
          time: new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          is_admin: msg.is_admin,
          created_at: msg.created_at
        }))
        setChatMessages(formattedMessages)
      }
    } catch (error) {
      console.error('Error loading chat messages:', error)
    }
  }

  // Send message as admin
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return
    
    const messageText = newMessage.trim()
    setNewMessage('')
    
    try {
      // Add message to local state immediately for better UX
      const tempMessage = {
        id: `temp_${Date.now()}`,
        sender: 'Admin',
        sender_name: 'TrackFlow Support',
        message: messageText,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        is_admin: true,
        created_at: new Date().toISOString()
      }
      
      setChatMessages(prev => [...prev, tempMessage])
      
      // Send message to database
      const { error } = await chatService.sendChatMessage(
        selectedChat.session_id,
        messageText,
        'admin',
        'TrackFlow Support',
        true
      )
      
      if (error) {
        console.error('Error sending message:', error)
        // Remove temp message on error
        setChatMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
        alert('Failed to send message. Please try again.')
      } else {
        // Update chat list
        await loadChatSessions()
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove temp message on error
      setChatMessages(prev => prev.filter(msg => msg.id !== `temp_${Date.now()}`))
      alert('Failed to send message. Please try again.')
    }
  }

  // Handle chat selection
  const handleChatSelect = (chat) => {
    setSelectedChat(chat)
    loadChatMessages(chat.session_id)
    
    // Clean up previous subscription
    if (chatSubscriptionRef.current) {
      chatSubscriptionRef.current.unsubscribe()
    }
    
    // Subscribe to real-time messages for this chat
    chatSubscriptionRef.current = supabase
      .channel(`chat-${chat.session_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${chat.session_id}`
        },
        (payload) => {
          const newMessage = payload.new
          
          // Only add if it's not from admin (to avoid duplicates)
          if (!newMessage.is_admin) {
            const formattedMessage = {
              id: newMessage.id,
              sender: newMessage.sender_name || 'User',
              sender_name: newMessage.sender_name,
              message: newMessage.message,
              time: new Date(newMessage.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              is_admin: false,
              created_at: newMessage.created_at
            }
            
            setChatMessages(prev => [...prev, formattedMessage])
          }
        }
      )
      .subscribe()
  }

  // Load data when component mounts or tab changes
  useEffect(() => {
    if (activeTab === 'overview') {
      loadOverviewData()
      
      // Subscribe to real-time parcel updates
      const parcelSubscription = supabase
        .channel('parcels')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'parcels' }, (payload) => {
          console.log('Parcel update:', payload)
          loadOverviewData()
        })
        .subscribe()

      return () => {
        parcelSubscription.unsubscribe()
      }
    }

    if (activeTab === 'livechat') {
      loadChatSessions()
      
      // Subscribe to new chat sessions
      chatListSubscriptionRef.current = supabase
        .channel('chat-sessions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, (payload) => {
          console.log('Chat update:', payload)
          loadChatSessions()
        })
        .subscribe()

      return () => {
        if (chatListSubscriptionRef.current) {
          chatListSubscriptionRef.current.unsubscribe()
        }
      }
    }
  }, [activeTab])

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      if (chatSubscriptionRef.current) {
        chatSubscriptionRef.current.unsubscribe()
      }
      if (chatListSubscriptionRef.current) {
        chatListSubscriptionRef.current.unsubscribe()
      }
    }
  }, [])

  const handleResolveMessage = async (messageId) => {
    try {
      // Use 'Resolved' status as defined in the database constraint
      const { error } = await supportService.updateSupportMessageStatus(messageId, 'Resolved')
      if (error) {
        console.error('Error updating message status:', error)
        alert(`Error updating message status: ${error.message}`)
        return
      }

      // Update local state
      setContactSupportMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'Resolved' } : msg
        )
      )
      setSupportMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'Resolved' } : msg
        )
      )
    } catch (error) {
      console.error('Error resolving message:', error)
      alert(`Error resolving message: ${error.message}`)
    }
  }

  // Handle opening reply modal
  const handleReplyToMessage = (message) => {
    console.log('Opening reply modal for message:', message)
    setSelectedMessage(message)
    setReplyMessage('')
    setShowEmailPreview(false)
    setShowReplyModal(true)
  }

  // Handle template selection
  const handleSelectTemplate = (templateKey) => {
    const template = replyTemplates[templateKey]
    if (template) {
      setReplyMessage(template)
    }
  }

  // Handle email preview
  const handleShowEmailPreview = () => {
    setShowEmailPreview(!showEmailPreview)
  }

  // Handle sending reply
  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedMessage) return

    setSendingReply(true)
    try {
      console.log('Sending reply for message ID:', selectedMessage.id)
      console.log('Current message status:', selectedMessage.status)
      
      // Use 'Resolved' as the status value (matches database constraint)
      const { error } = await supportService.updateSupportMessageStatus(
        selectedMessage.id, 
        'Resolved', 
        replyMessage.trim()
      )
      
      if (error) {
        console.error('Error updating message with admin response:', error)
        console.error('Error details:', error.message, error.code, error.details)
        alert(`Failed to send reply: ${error.message}`)
        return
      }
      
      // Update local state to show as Resolved with admin response
      setContactSupportMessages(prev => 
        prev.map(msg => 
          msg.id === selectedMessage.id 
            ? { 
                ...msg, 
                status: 'Resolved',
                admin_response: replyMessage.trim()
              }
            : msg
        )
      )
      
      setSupportMessages(prev => 
        prev.map(msg => 
          msg.id === selectedMessage.id 
            ? { 
                ...msg, 
                status: 'Resolved',
                admin_response: replyMessage.trim()
              }
            : msg
        )
      )
      
      // Close modal and show success message
      setShowReplyModal(false)
      setSelectedMessage(null)
      setReplyMessage('')
      
      alert(`✅ Reply sent successfully to ${selectedMessage.email}!`)

    } catch (error) {
      console.error('Error sending reply:', error)
      alert(`Failed to send reply: ${error.message}`)
    } finally {
      setSendingReply(false)
    }
  }

  // Handle closing reply modal
  const handleCloseReplyModal = () => {
    setShowReplyModal(false)
    setSelectedMessage(null)
    setReplyMessage('')
    setShowEmailPreview(false)
  }

  const handleUpdateParcelStatus = useCallback(async (parcelId, newStatus) => {
    try {
      const { error } = await parcelService.updateParcelStatus(parcelId, newStatus)
      if (error) {
        console.error('Error updating parcel status:', error)
        alert('Error updating parcel status. Please try again.')
        return
      }

      // Update local state
      setParcels(prev => 
        prev.map(parcel => 
          parcel.id === parcelId ? { ...parcel, status: newStatus } : parcel
        )
      )

      // Log admin action
      await adminLogService.createAdminLog('parcel_status_update', {
        parcel_id: parcelId,
        old_status: parcels.find(p => p.id === parcelId)?.status,
        new_status: newStatus
      })

      console.log(`Parcel ${parcelId} status updated to: ${newStatus}`)
    } catch (error) {
      console.error('Error updating parcel status:', error)
      alert('Error updating parcel status. Please try again.')
    }
  }, [parcels])

  // Handle special delivery order status update
  const handleUpdateSpecialDeliveryStatus = useCallback(async (orderId, newStatus) => {
    try {
      const result = await specialDeliveryService.updateOrderStatus(orderId, newStatus)
      if (!result.success) {
        console.error('Error updating special delivery order status:', result.error)
        alert('Error updating order status. Please try again.')
        return
      }

      // Update local state
      setSpecialDeliveryOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )

      console.log(`Special delivery order ${orderId} status updated to: ${newStatus}`)
    } catch (error) {
      console.error('Error updating special delivery order status:', error)
      alert('Error updating order status. Please try again.')
    }
  }, [])

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      if (activeTab === 'users') {
        setLoadingUsers(true)
        try {
          const { data, error } = await userService.getAllUsers()
          if (error) {
            console.error('Error loading users:', error)
            if (error.message.includes('JWT')) {
              alert('Authentication error. Please sign in again.')
            } else if (error.message.includes('infinite recursion')) {
              alert('Database policy error. Please contact support.')
            } else {
              alert('Error loading users: ' + error.message)
            }
          } else {
            setUsers(data || [])
          }
        } catch (error) {
          console.error('Error loading users:', error)
          alert('Error loading users')
        } finally {
          setLoadingUsers(false)
        }
      }

      if (activeTab === 'parcels') {
        setLoadingParcels(true)
        try {
          const { data, error } = await parcelService.getAllParcels()
          if (error) {
            console.error('Error loading parcels:', error)
            alert('Error loading parcels')
          } else {
            setParcels(data || [])
          }
        } catch (error) {
          console.error('Error loading parcels:', error)
          alert('Error loading parcels')
        } finally {
          setLoadingParcels(false)
        }
      }

      if (activeTab === 'support') {
        setLoadingSupport(true)
        try {
          const { data, error } = await supportService.getAllSupportMessages()
          if (error) {
            console.error('Error loading support messages:', error)
            alert('Error loading support messages')
          } else {
            // Set only the real support messages from the database
            setContactSupportMessages(data || [])
            // Update the supportMessages state to show the real data as well
            setSupportMessages(data || [])
          }
        } catch (error) {
          console.error('Error loading support messages:', error)
          alert('Error loading support messages')
        } finally {
          setLoadingSupport(false)
        }
      }

      if (activeTab === 'livechat') {
        setLoadingSupport(true)
        try {
          const { data, error } = await chatService.getAllChatSessions()
          if (error) {
            console.error('Error loading chat messages:', error)
            alert('Error loading chat messages')
          } else {
            // Transform chat data for display
            const transformedChats = data?.map(session => ({
              id: session.id,
              name: session.sender_name || 'Anonymous User',
              status: 'online',
              lastMessage: session.message || 'No message',
              unread: 1
            })) || []
            setLiveChats(transformedChats)
          }
        } catch (error) {
          console.error('Error loading chat messages:', error)
          alert('Error loading chat messages')
        } finally {
          setLoadingSupport(false)
        }
      }

      if (activeTab === 'bookings') {
        loadBookingsData()
      }
    }

    loadData()
  }, [activeTab])

  // Debug function to test database connection
  const testDatabaseConnection = async () => {
    try {
      const { data, error, count } = await supabase
        .from('parcels')
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.error('Database connection error:', error)
        alert(`Database connection failed: ${error.message}`)
      } else {
        console.log('Database connection successful. Parcel count:', count)
        alert(`Database connection successful! Found ${count || 0} parcels in the database.`)
      }
    } catch (error) {
      console.error('Database connection test failed:', error)
      alert(`Database connection test failed: ${error.message}`)
    }
  }

  // Debug function to check support message statuses
  const checkSupportMessageStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('id, status')
        .limit(5)
      
      if (error) {
        console.error('Error checking support message statuses:', error)
        alert(`Error: ${error.message}`)
      } else {
        console.log('Support message statuses:', data)
        const statuses = data?.map(msg => msg.status) || []
        alert(`Found statuses: ${[...new Set(statuses)].join(', ')}`)
      }
    } catch (error) {
      console.error('Error checking support message statuses:', error)
      alert(`Error: ${error.message}`)
    }
  }

  // Filter functions for bookings
  const filteredSpecialDeliveryOrders = useMemo(() => {
    if (bookingsFilter === 'all') return specialDeliveryOrders
    return specialDeliveryOrders.filter(order => order.status === bookingsFilter)
  }, [specialDeliveryOrders, bookingsFilter])

  const filteredQuoteRequests = useMemo(() => {
    if (quotesFilter === 'all') return quoteRequests
    return quoteRequests.filter(request => {
      if (quotesFilter === 'pending') return !request.status || request.status !== 'Resolved'
      if (quotesFilter === 'resolved') return request.status === 'Resolved'
      return true
    })
  }, [quoteRequests, quotesFilter])

  // Memoized stats calculation for better performance
  const stats = useMemo(() => calculateStats(parcels), [parcels])
  
  // Memoized recent activity for better performance
  const recentActivity = useMemo(() => {
    return generateRecentActivity(parcels)
  }, [parcels, generateRecentActivity])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">TrackFlow Admin</span>
            </div>
            <button
              onClick={() => {
                const confirmed = window.confirm('Are you sure you want to sign out?')
                if (confirmed && onSignOut) {
                  onSignOut()
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {['overview', 'users', 'parcels', 'bookings', 'support', 'livechat'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
              >
                {tab === 'livechat' ? 'Live Chat' : tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-md">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Parcels</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalParcels}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-md">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Delivered</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.deliveredParcels}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-md">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.pendingParcels}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-md">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Cancelled</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.cancelledParcels}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={activity.id || index} className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'new' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {activity.type === 'new' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-500">{activity.details}</p>
                        <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                  {recentActivity.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Chat Tab */}
        {activeTab === 'livechat' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Live Chat Support</h2>
            
            {/* WhatsApp Desktop Style Layout */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
              <div className="flex h-full">
                
                {/* Left Sidebar - Chat List (WhatsApp Style) */}
                <div className="w-1/3 bg-gray-50 border-r border-gray-200">
                  {/* Chat List Header */}
                  <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">Chats</h3>
                      <div className="flex space-x-2">
                        <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="p-3 bg-white border-b border-gray-200">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search or start new chat"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                      />
                    </div>
                  </div>
                  
                  {/* Chat List */}
                  <div className="overflow-y-auto" style={{ height: 'calc(100% - 120px)' }}>
                    {loadingChats ? (
                      <div className="flex items-center justify-center p-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-sm text-gray-600">Loading chats...</span>
                      </div>
                    ) : liveChats.length > 0 ? (
                      liveChats.map((chat) => (
                        <div
                          key={chat.session_id}
                          onClick={() => handleChatSelect(chat)}
                          className={`flex items-center p-3 cursor-pointer transition-colors ${
                            selectedChat?.session_id === chat.session_id 
                              ? 'bg-blue-50 border-r-4 border-blue-500' 
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {/* User Avatar */}
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                              {(chat.user_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white bg-green-400"></div>
                          </div>
                          
                          {/* Chat Info */}
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-gray-900 truncate">{chat.user_name || 'Unknown User'}</p>
                              <span className="text-xs text-gray-500">
                                {new Date(chat.latest_message_time).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-sm text-gray-600 truncate pr-2">
                                {chat.is_latest_from_admin ? '✓ ' : ''}{chat.latest_message}
                              </p>
                              {chat.unread_count > 0 && (
                                <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                  {chat.unread_count}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-6">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <p className="text-gray-500">No active chats</p>
                        <p className="text-sm text-gray-400 mt-1">User chats will appear here</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel - Chat Messages (WhatsApp Style) */}
                <div className="flex-1 flex flex-col">
                  {selectedChat ? (
                    <>
                      {/* Chat Header */}
                      <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {(selectedChat.user_name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-green-400"></div>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{selectedChat.user_name || 'Unknown User'}</h3>
                              <p className="text-sm text-gray-600">
                                {selectedChat.user_email || 'Online'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Messages Area */}
                      <div 
                        className="flex-1 overflow-y-auto bg-gray-50 relative"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f3f4f6' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        }}
                      >
                        <div className="p-4 space-y-3">
                          {chatMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.sender === 'Admin' || msg.is_admin ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`flex items-end space-x-2 max-w-sm ${msg.sender === 'Admin' || msg.is_admin ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                {/* Avatar for User */}
                                {!(msg.sender === 'Admin' || msg.is_admin) && (
                                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-semibold mb-1">
                                    {(selectedChat.user_name || 'U').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                
                                {/* Message Bubble */}
                                <div className="relative">
                                  <div
                                    className={`px-4 py-2 rounded-lg shadow-sm ${
                                      msg.sender === 'Admin' || msg.is_admin
                                        ? 'bg-green-500 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 rounded-bl-none border'
                                    }`}
                                  >
                                    <p className="text-sm leading-relaxed">{msg.message}</p>
                                    <div className={`flex items-center justify-end mt-1 space-x-1 ${
                                      msg.sender === 'Admin' || msg.is_admin ? 'text-green-100' : 'text-gray-400'
                                    }`}>
                                      <span className="text-xs">{msg.time}</span>
                                      {(msg.sender === 'Admin' || msg.is_admin) && (
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Message Tail */}
                                  <div
                                    className={`absolute bottom-0 w-0 h-0 ${
                                      msg.sender === 'Admin' || msg.is_admin
                                        ? 'right-0 border-l-8 border-l-green-500 border-t-8 border-t-transparent'
                                        : 'left-0 border-r-8 border-r-white border-t-8 border-t-transparent'
                                    }`}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Message Input */}
                      <div className="bg-gray-100 px-4 py-3 border-t border-gray-200">
                        <div className="flex items-center space-x-3">
                          {/* Message Input Field */}
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                              placeholder="Type a message..."
                              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                          </div>
                          
                          {/* Send Button */}
                          <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">TrackFlow Admin Chat</h3>
                        <p className="text-gray-600">Select a conversation to start messaging with users</p>
                        <p className="text-sm text-gray-500 mt-2">Real-time support for your customers</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <div className="flex gap-2">
                <button 
                  onClick={checkSupportMessageStatuses}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                >
                  Check Status Values
                </button>
                <button 
                  onClick={testDatabaseConnection}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Test DB Connection
                </button>
              </div>
            </div>
            
            {loadingUsers ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading users...</span>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {users.length > 0 ? users.map((user) => (
                    <li key={user.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.name ? user.name.charAt(0) : user.email.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">
                              {user.name || user.email.split('@')[0]}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <p className="text-xs text-gray-400">
                              Joined: {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.email_confirmed_at ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.email_confirmed_at ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                      </div>
                    </li>
                  )) : (
                    <li className="px-6 py-4 text-center text-gray-500">
                      No users found
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Parcels Tab */}
        {activeTab === 'parcels' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Parcel Management</h2>
            
            {loadingParcels ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading parcels...</span>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {parcels.length > 0 ? parcels.map((parcel) => (
                    <li key={parcel.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              Parcel #{parcel.id}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                parcel.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                parcel.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                                parcel.status === 'Pending Pickup' ? 'bg-yellow-100 text-yellow-800' :
                                parcel.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {parcel.status}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                From: {parcel.sender_name || 'Unknown'} ({parcel.sender_location || 'Unknown'})
                              </p>
                              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                To: {parcel.recipient_name || 'Unknown'} ({parcel.recipient_location || 'Unknown'})
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <p>
                                Created: {new Date(parcel.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              <strong>Item:</strong> {parcel.item_description || 'No description'}
                            </p>
                            {parcel.dimensions && (
                              <p className="text-sm text-gray-600">
                                <strong>Dimensions:</strong> {parcel.dimensions}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="ml-6 flex-shrink-0">
                          <select
                            value={parcel.status}
                            onChange={(e) => handleUpdateParcelStatus(parcel.id, e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          >
                            <option value="Pending Pickup">Pending Pickup</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    </li>
                  )) : (
                    <li className="px-6 py-4 text-center text-gray-500">
                      No parcels found
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Bookings & Quotes Management</h2>
              <div className="flex space-x-4">
                <button
                  onClick={loadBookingsData}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Refresh Data
                </button>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-md">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Special Deliveries</p>
                    <p className="text-2xl font-semibold text-gray-900">{specialDeliveryOrders.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-md">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Quote Requests</p>
                    <p className="text-2xl font-semibold text-gray-900">{quoteRequests.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-md">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      KSh {specialDeliveryOrders.reduce((total, order) => total + (order.total_cost || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-md">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {specialDeliveryOrders.filter(order => {
                        const orderDate = new Date(order.created_at)
                        const now = new Date()
                        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()
                      }).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {loadingBookings ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading bookings...</span>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                
                {/* Special Delivery Orders */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">Special Delivery Orders</h3>
                      <select
                        value={bookingsFilter}
                        onChange={(e) => setBookingsFilter(e.target.value)}
                        className="text-sm border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Orders</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="picked_up">Picked Up</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                    {filteredSpecialDeliveryOrders.length > 0 ? filteredSpecialDeliveryOrders.map((order) => (
                      <div key={order.id} className="px-6 py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-medium text-gray-900">Order #{order.order_number}</h4>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status || 'Pending'}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                              <p><strong>Service:</strong> {order.service_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                              <p><strong>From:</strong> {order.pickup_location}</p>
                              <p><strong>To:</strong> {order.delivery_location}</p>
                              <p><strong>Distance:</strong> {order.distance}km</p>
                              <p><strong>Total:</strong> KSh {order.total_cost?.toLocaleString()}</p>
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                              <p><strong>Contact:</strong> {order.sender_name} - {order.sender_phone}</p>
                              {order.sender_email && <p><strong>Email:</strong> {order.sender_email}</p>}
                              <p><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <select
                              value={order.status || 'pending'}
                              onChange={(e) => handleUpdateSpecialDeliveryStatus(order.id, e.target.value)}
                              className="mt-1 block w-full pl-3 pr-10 py-1 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="picked_up">Picked Up</option>
                              <option value="in_transit">In Transit</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="px-6 py-4 text-center text-gray-500">
                        No special delivery orders found
                      </div>
                    )}
                  </div>
                </div>

                {/* Quote Requests */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">Quote Requests</h3>
                      <select
                        value={quotesFilter}
                        onChange={(e) => setQuotesFilter(e.target.value)}
                        className="text-sm border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Quotes</option>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                    {filteredQuoteRequests.length > 0 ? filteredQuoteRequests.map((request) => (
                      <div key={request.id} className="px-6 py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-medium text-gray-900">{request.subject || 'Quote Request'}</h4>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                request.status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {request.status || 'Pending'}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                              <p><strong>From:</strong> {request.name}</p>
                              <p><strong>Email:</strong> {request.email}</p>
                              {request.phone && <p><strong>Phone:</strong> {request.phone}</p>}
                            </div>
                            <div className="mt-2 text-sm text-gray-700">
                              <p className="line-clamp-3">{request.message}</p>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              {new Date(request.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            {request.status !== 'Resolved' && (
                              <button
                                onClick={() => handleReplyToMessage(request)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                              >
                                Respond
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="px-6 py-4 text-center text-gray-500">
                        No quote requests found
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Support Tab */}
        {activeTab === 'support' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Support Messages</h2>
            
            {loadingSupport ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading support messages...</span>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="divide-y divide-gray-200">
                  {contactSupportMessages.length > 0 ? contactSupportMessages.map((message) => (
                    <div key={message.id} className="px-6 py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-medium text-gray-900">{message.subject || 'Support Request'}</h3>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              message.status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {message.status || 'Pending'}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            <p><strong>From:</strong> {message.name || message.full_name}</p>
                            <p><strong>Email:</strong> {message.email}</p>
                            {message.phone && <p><strong>Phone:</strong> {message.phone}</p>}
                          </div>
                          <div className="mt-3">
                            <p className="text-sm text-gray-900">{message.message}</p>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            {new Date(message.date || message.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReplyToMessage(message)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                            >
                              Reply
                            </button>
                            {message.status !== 'Resolved' && (
                              <button
                                onClick={() => handleResolveMessage(message.id)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                              >
                                Mark Resolved
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="px-6 py-4 text-center text-gray-500">
                      No support messages found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {showReplyModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Reply to Support Message</h2>
              <button
                onClick={handleCloseReplyModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Original Message */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Original Message</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>From:</strong> {selectedMessage.name} ({selectedMessage.email})</p>
                <p><strong>Subject:</strong> {selectedMessage.subject}</p>
                <p><strong>Date:</strong> {new Date(selectedMessage.date || selectedMessage.created_at).toLocaleString()}</p>
              </div>
              <div className="mt-3 p-3 bg-white rounded border-l-4 border-blue-500">
                <p className="text-gray-800">{selectedMessage.message}</p>
              </div>
            </div>

            {/* Template Selection */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Reply Templates</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={() => handleSelectTemplate('delivery-delay')}
                  className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  Delivery Delay
                </button>
                <button
                  onClick={() => handleSelectTemplate('tracking-issue')}
                  className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                >
                  Tracking Issue
                </button>
                <button
                  onClick={() => handleSelectTemplate('pricing-inquiry')}
                  className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                >
                  Pricing Inquiry
                </button>
                <button
                  onClick={() => handleSelectTemplate('general')}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  General Response
                </button>
              </div>
            </div>

            {/* Reply Message */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Reply
              </label>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Type your professional reply here..."
              />
              <div className="mt-2 text-sm text-gray-500">
                {replyMessage.length} characters
              </div>
            </div>

            {/* Email Preview */}
            {showEmailPreview && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-semibold text-gray-900 mb-3">Email Preview</h4>
                <div className="bg-white p-4 rounded border text-sm">
                  <div className="border-b pb-3 mb-3">
                    <p><strong>To:</strong> {selectedMessage.email}</p>
                    <p><strong>From:</strong> TrackFlow Support Team</p>
                    <p><strong>Subject:</strong> Re: {selectedMessage.subject}</p>
                  </div>
                  <div className="space-y-3">
                    <p>Dear {selectedMessage.name},</p>
                    <div className="whitespace-pre-wrap">{replyMessage}</div>
                    <div className="mt-4 pt-4 border-t text-gray-600">
                      <p>Best regards,<br />TrackFlow Support Team</p>
                      <p className="text-xs mt-2">
                        📞 +254 714 468 611 | 📧 support@trackflow.co.ke<br />
                        🌐 www.trackflow.co.ke
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={handleShowEmailPreview}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                {showEmailPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              <button
                onClick={handleCloseReplyModal}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReply}
                disabled={!replyMessage.trim() || sendingReply}
                className="px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sendingReply ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
