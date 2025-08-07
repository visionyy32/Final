import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { chatService, supportService } from '../services/supabaseService'
import { supabase } from '../lib/supabase'

const FAQ = ({ userData }) => {
  const [openItems, setOpenItems] = useState(new Set())
  const [activeTab, setActiveTab] = useState('faq') // 'faq', 'chat'
  const [chatMessages, setChatMessages] = useState([])
  const [newChatMessage, setNewChatMessage] = useState('')
  const [chatSessionId, setChatSessionId] = useState(null)
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [isChatConnected, setIsChatConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [lastSeen, setLastSeen] = useState(null)
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)
  const subscriptionRef = useRef(null) // Store subscription reference

  // Memoize scroll function to prevent unnecessary re-renders
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages, scrollToBottom])

  // Initialize chat session when chat tab is opened (only once)
  useEffect(() => {
    if (activeTab === 'chat' && !chatSessionId) {
      initializeChatSession()
    }
  }, [activeTab, chatSessionId])

  // Set up real-time subscription for chat messages (optimized)
  useEffect(() => {
    if (chatSessionId && activeTab === 'chat') {
      loadChatMessages()
      setUpChatSubscription()
    }
    
    // Clean up subscription when tab changes or component unmounts
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [chatSessionId, activeTab])

  const initializeChatSession = () => {
    // Create a unique session ID for this chat
    const sessionId = userData?.id ? `user-${userData.id}-${Date.now()}` : `anonymous-${Date.now()}`
    setChatSessionId(sessionId)
    setIsChatConnected(true)
    
    // Send initial welcome message
    const welcomeMessage = {
      id: Date.now(),
      sender_name: 'Support',
      message: 'Hello! How can we help you today?',
      is_admin: true,
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
    setChatMessages([welcomeMessage])
  }

  const loadChatMessages = async () => {
    if (!chatSessionId) return
    
    setIsLoadingChat(true)
    try {
      const { data, error } = await chatService.getChatMessages(chatSessionId)
      if (error) {
        console.error('Error loading chat messages:', error)
      } else {
        const messagesWithTime = (data || []).map(msg => ({
          ...msg,
          time: new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }))
        setChatMessages(messagesWithTime)
      }
    } catch (error) {
      console.error('Error loading chat messages:', error)
    } finally {
      setIsLoadingChat(false)
    }
  }

  const setUpChatSubscription = useCallback(() => {
    if (!chatSessionId || subscriptionRef.current) return

    // Clean up existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    const subscription = supabase
      .channel(`chat-${chatSessionId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `session_id=eq.${chatSessionId}`
        }, 
        (payload) => {
          const newMessage = {
            ...payload.new,
            time: new Date(payload.new.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          }
          
          // If it's an admin message, simulate typing indicator first
          if (newMessage.is_admin) {
            setIsTyping(true)
            setTimeout(() => {
              setIsTyping(false)
              setChatMessages(prev => [...prev, newMessage])
            }, 800) // Reduced from 1000ms to 800ms for faster response
          } else {
            setChatMessages(prev => [...prev, newMessage])
          }
        }
      )
      .subscribe()

    subscriptionRef.current = subscription
    setIsChatConnected(true)
  }, [chatSessionId])

  // Memoize FAQ data to prevent re-creation on every render
  const faqData = useMemo(() => [
    {
      question: "How do I track my parcel?",
      answer: "You can track your parcel by entering your tracking number in the tracking section on our homepage or dedicated tracking page. Simply input the tracking number provided to you and click 'Track' to get real-time updates on your parcel's location and delivery status."
    },
    {
      question: "What are your delivery times?",
      answer: "We offer two main delivery services: Express Delivery (same-day or next-day delivery) and Standard Delivery (2-3 business days). Delivery times may vary based on your location and package size. Express delivery is available in major cities, while standard delivery covers nationwide."
    },
    {
      question: "Do you deliver nationwide?",
      answer: "Yes, we deliver to all 47 counties in Kenya. We have extensive coverage across the country with local offices in major cities and partnerships with local delivery networks in rural areas to ensure comprehensive nationwide coverage."
    },
    {
      question: "How much does shipping cost?",
      answer: "Shipping costs depend on several factors including package weight, distance, and service type. We offer competitive rates starting from KES 500 for local deliveries. Use our cost calculator on the homepage for instant estimates, or contact our customer service for bulk shipping quotes."
    },
    {
      question: "What if my parcel is damaged?",
      answer: "We provide insurance coverage for all parcels. If you receive a damaged package, please contact our support team immediately. Take photos of the damage and keep the original packaging. We'll investigate and process your claim within 48 hours."
    },
    {
      question: "Can I schedule a pickup?",
      answer: "Yes, you can schedule a pickup through our website or by calling our customer service. We offer flexible pickup times and can accommodate same-day pickups in major cities. Simply provide your address and preferred pickup time."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept various payment methods including M-Pesa, Airtel Money, bank transfers, and cash on delivery. For online payments, we also accept major credit cards and mobile money services. Payment is required before shipment for most services."
    },
    {
      question: "How do I calculate shipping costs?",
      answer: "Use our cost calculator on the homepage by entering your package details including weight, dimensions, origin, and destination. The calculator will provide instant estimates for both express and standard delivery options."
    },
    {
      question: "What items are prohibited from shipping?",
      answer: "We cannot ship hazardous materials, illegal items, perishable goods without proper packaging, or items that violate local regulations. This includes explosives, flammable materials, drugs, and certain electronics. Contact us for specific restrictions."
    },
    {
      question: "How do I contact customer support?",
      answer: "You can reach our customer support team through multiple channels: Phone (+254 714 468 611), Email (support@trackflow.co.ke), or our contact form on the website. We provide 24/7 support for urgent tracking issues."
    },
    {
      question: "Can I change my delivery address?",
      answer: "Yes, you can change your delivery address before the parcel is picked up. Contact our customer service with your tracking number and new address. Changes may incur additional fees depending on the new location."
    },
    {
      question: "What happens if no one is home for delivery?",
      answer: "If no one is available to receive the package, our delivery agent will attempt delivery again the next business day. You can also authorize someone else to receive the package or request delivery to a nearby pickup point."
    }
  ], []) // Empty dependency array since FAQ data is static

  const toggleItem = useCallback((index) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }, [openItems])

  const handleSendChatMessage = useCallback(async () => {
    if (!newChatMessage.trim() || !chatSessionId) return

    const userMessage = {
      user_id: userData?.id || null,
      session_id: chatSessionId,
      sender_name: userData?.name || 'Anonymous User',
      message: newChatMessage.trim(),
      is_admin: false
    }

    // Add message to local state immediately for better UX
    const tempMessage = {
      ...userMessage,
      id: Date.now(),
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
    setChatMessages(prev => [...prev, tempMessage])
    setNewChatMessage('')

    // Save to database
    try {
      const { error } = await chatService.sendChatMessage(userMessage)
      if (error) {
        console.error('Error saving chat message:', error)
        // Remove the temporary message if save failed
        setChatMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
        alert('Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('Error saving chat message:', error)
      // Remove the temporary message if save failed
      setChatMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
      alert('Failed to send message. Please try again.')
    }
  }, [newChatMessage, chatSessionId, userData])

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-in-out;
          }
          
          /* Custom scrollbar for chat */
          .chat-container::-webkit-scrollbar {
            width: 4px;
          }
          
          .chat-container::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .chat-container::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 2px;
          }
          
          .chat-container::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.3);
          }
        `}
      </style>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'faq'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            FAQ
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Live Chat
          </button>
        </div>
      </div>

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <>
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
            <p className="text-xl text-gray-600">Find answers to common questions about our services</p>
          </div>

          {/* FAQ Categories */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-blue-50 rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                </svg>
              </div>
              <h3 className="font-semibold text-blue-900 mb-2">Tracking & Delivery</h3>
              <p className="text-sm text-blue-700">Questions about parcel tracking and delivery services</p>
            </div>

            <div className="bg-green-50 rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="font-semibold text-green-900 mb-2">Pricing & Payment</h3>
              <p className="text-sm text-green-700">Information about costs and payment methods</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75A9.75 9.75 0 0012 2.25z" />
                </svg>
              </div>
              <h3 className="font-semibold text-purple-900 mb-2">Support & Services</h3>
              <p className="text-sm text-purple-700">Customer support and additional services</p>
            </div>
          </div>

          {/* FAQ Items */}
          <div className="bg-white rounded-lg shadow-lg">
            {faqData.map((item, index) => (
              <div key={index} className="border-b border-gray-200 last:border-b-0">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-4 text-left focus:outline-none focus:bg-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 pr-4">{item.question}</h3>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        openItems.has(index) ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {openItems.has(index) && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-blue-600 hover:underline">Track Your Parcel</a></li>
                <li><a href="#" className="text-blue-600 hover:underline">Calculate Shipping Cost</a></li>
                <li><a href="#" className="text-blue-600 hover:underline">Service Areas</a></li>
                <li><a href="#" className="text-blue-600 hover:underline">Terms & Conditions</a></li>
              </ul>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
              <ul className="space-y-2 text-sm">
                <li>📞 +254 714 468 611</li>
                <li>📧 support@trackflow.co.ke</li>
                <li>🕒 Mon-Fri: 8AM-6PM</li>
                <li>📍 Nairobi, Kenya</li>
              </ul>
            </div>
          </div>
        </>
      )}

      {/* Live Chat Tab */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-2xl mx-auto">
          {/* WhatsApp-style header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Support avatar */}
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75A9.75 9.75 0 0012 2.25z" />
                  </svg>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Support Team</h3>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isChatConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <p className="text-sm text-gray-500">
                      {isChatConnected ? (
                        isTyping ? (
                          <span className="flex items-center">
                            <span>typing</span>
                            <span className="ml-1 flex space-x-1">
                              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
                              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            </span>
                          </span>
                        ) : (
                          <span>Online • Typically replies in minutes</span>
                        )
                      ) : (
                        'Connecting...'
                      )}
                    </p>
                  </div>
                </div>
                
                {userData?.name && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">{userData.name}</p>
                    <p className="text-xs text-gray-500">You</p>
                  </div>
                )}
              </div>
              
              {/* Chat actions */}
              <div className="flex items-center space-x-2">
                <button className="w-8 h-8 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button className="w-8 h-8 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="h-80 flex flex-col">
            {/* Chat Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 chat-container"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f0f0f0' fill-opacity='0.4' fill-rule='nonzero'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
            >
              {isLoadingChat ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading chat...</span>
                </div>
              ) : chatMessages.length > 0 ? (
                <>
                  {chatMessages.map((msg, index) => {
                    const isConsecutive = index > 0 && 
                      chatMessages[index - 1].is_admin === msg.is_admin &&
                      chatMessages[index - 1].sender_name === msg.sender_name
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'} ${
                          isConsecutive ? 'mt-1' : 'mt-4'
                        } animate-fadeIn`}
                        style={{
                          animation: 'fadeIn 0.3s ease-in-out'
                        }}
                      >
                        <div className={`flex ${msg.is_admin ? 'flex-row' : 'flex-row-reverse'} items-end space-x-2 max-w-[75%] md:max-w-[60%]`}>
                          {/* Avatar */}
                          {!isConsecutive && (
                            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm ${
                              msg.is_admin 
                                ? 'bg-green-500 text-white' 
                                : 'bg-blue-500 text-white'
                            }`}>
                              {msg.is_admin ? 'S' : (msg.sender_name?.charAt(0)?.toUpperCase() || 'U')}
                            </div>
                          )}
                          {isConsecutive && <div className="w-7"></div>}
                          
                          {/* Message Bubble */}
                          <div className={`relative px-3 py-2 rounded-2xl shadow-sm transition-all hover:shadow-md ${
                            msg.is_admin
                              ? 'bg-white text-gray-900 border border-gray-200'
                              : 'bg-blue-500 text-white'
                          }`}>
                            {/* WhatsApp-style tail */}
                            {!isConsecutive && (
                              <div className={`absolute bottom-0 w-3 h-3 ${
                                msg.is_admin 
                                  ? 'left-0 -ml-1 bg-white border-l border-b border-gray-200' 
                                  : 'right-0 -mr-1 bg-blue-500'
                              } transform rotate-45`}></div>
                            )}
                            
                            {/* Sender name (only for admin messages or first message in sequence) */}
                            {!isConsecutive && msg.is_admin && (
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-xs font-semibold text-green-600">
                                  {msg.sender_name}
                                </span>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                  Support
                                </span>
                              </div>
                            )}
                            
                            {/* Message content */}
                            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.message}</p>
                            
                            {/* Timestamp */}
                            <div className={`flex items-center justify-end mt-1 space-x-1`}>
                              <span className={`text-xs ${
                                msg.is_admin ? 'text-gray-500' : 'text-blue-100'
                              }`}>
                                {msg.time}
                              </span>
                              {/* Read status (for user messages) */}
                              {!msg.is_admin && (
                                <div className="flex space-x-0.5">
                                  <svg className="w-3 h-3 text-blue-100" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <svg className="w-3 h-3 text-blue-100" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex justify-start mt-2 animate-fadeIn">
                      <div className="flex items-end space-x-2 max-w-[60%]">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-xs font-semibold text-white shadow-sm">
                          S
                        </div>
                        <div className="bg-white text-gray-900 border border-gray-200 px-3 py-2 rounded-2xl shadow-sm">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Auto-scroll anchor */}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">No messages yet</p>
                    <p className="text-gray-400 text-xs mt-1">Start the conversation with our support team!</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Chat Input */}
            <div className="px-3 py-2 border-t border-gray-200 bg-white">
              <div className="flex items-end space-x-2">
                {/* Attachment button */}
                <button className="flex-shrink-0 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                
                {/* Message input */}
                <div className="flex-1 relative bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-blue-500 transition-colors">
                  <textarea
                    value={newChatMessage}
                    onChange={(e) => setNewChatMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-transparent border-none rounded-2xl px-3 py-2 pr-10 text-sm resize-none focus:outline-none focus:ring-0 placeholder-gray-500 max-h-20"
                    rows="1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendChatMessage()
                      }
                    }}
                    onInput={(e) => {
                      // Auto-resize textarea
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'
                    }}
                  />
                  
                  {/* Emoji button */}
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                
                {/* Send button */}
                <button
                  onClick={handleSendChatMessage}
                  disabled={!newChatMessage.trim()}
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all transform ${
                    newChatMessage.trim()
                      ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:scale-105 active:scale-95'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              
              {/* Typing indicator (when needed) */}
              <div className="mt-2 text-xs text-gray-400 min-h-[16px]">
                {isChatConnected && (
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Connected • Press Enter to send, Shift+Enter for new line
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}

export default FAQ
