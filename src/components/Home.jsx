import { useState, useEffect } from 'react'
import ParcelPlacementForm from './ParcelPlacementForm'
import Profile from './Profile'
import { parcelService, notificationService } from '../services/supabaseService'
import { supabase } from '../lib/supabase'

const Home = ({ userData }) => {
  const [activeTab, setActiveTab] = useState('track')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [parcelDetails, setParcelDetails] = useState(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [costEstimate, setCostEstimate] = useState(null)
  const [isPaymentComplete, setIsPaymentComplete] = useState(false)
  const [submittedParcels, setSubmittedParcels] = useState([])
  const [loadingParcels, setLoadingParcels] = useState(false)
  const [deliveryNotification, setDeliveryNotification] = useState(null)

    // Load user's parcels from Supabase with optimizations
  useEffect(() => {
    const loadUserParcels = async () => {
      if (userData?.id) {
        setLoadingParcels(true)
        try {
          // Shorter timeout for faster response
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 5000) // Reduced from 10s to 5s
          )
          
          const dataPromise = parcelService.getUserParcels()
          
          const { data, error } = await Promise.race([dataPromise, timeoutPromise])
          
          if (error) {
            console.error('Error loading user parcels:', error)
            // Set empty array instead of leaving undefined
            setSubmittedParcels([])
          } else {
            // Filter parcels for current user
            const userParcels = data?.filter(parcel => parcel.user_id === userData.id) || []
            console.log('Loaded user parcels:', userParcels)
            setSubmittedParcels(userParcels)
          }
        } catch (error) {
          console.error('Error loading user parcels:', error)
          // Set empty array on error for better UX
          setSubmittedParcels([])
        } finally {
          // Add minimum loading time for smooth UX
          setTimeout(() => {
            setLoadingParcels(false)
          }, 300)
        }
      }
    }

    // Load parcels initially
    if (userData?.id && activeTab === 'track') {
      loadUserParcels()
    }

    // Set up real-time subscription for parcel updates
    let subscription = null
    if (userData?.id) {
      subscription = supabase
        .channel('parcel_updates')
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'parcels',
            filter: `user_id=eq.${userData.id}`
          }, 
          (payload) => {
            console.log('Real-time parcel update:', payload)
            const updatedParcel = payload.new
            
            setSubmittedParcels(prev => {
              const updated = prev.map(parcel => 
                parcel.id === updatedParcel.id ? updatedParcel : parcel
              )
              
              // If parcel was marked as delivered, show notification and remove it after 2 minutes
              if (updatedParcel.status === 'Delivered') {
                setDeliveryNotification({
                  trackingNumber: updatedParcel.tracking_number,
                  message: `🎉 Parcel ${updatedParcel.tracking_number} has been delivered!`
                })
                
                // Clear notification after 5 seconds
                setTimeout(() => {
                  setDeliveryNotification(null)
                }, 5000)
                
                // Remove from active parcels after 2 minutes
                setTimeout(() => {
                  setSubmittedParcels(current => 
                    current.filter(parcel => parcel.id !== updatedParcel.id)
                  )
                  console.log(`Parcel ${updatedParcel.tracking_number} removed from active parcels after delivery`)
                }, 2 * 60 * 1000) // 2 minutes
              }
              
              // If parcel was cancelled, remove it immediately from user's view
              if (updatedParcel.status === 'Cancelled') {
                console.log(`Parcel ${updatedParcel.tracking_number} was cancelled, removing from user view`)
                return prev.filter(parcel => parcel.id !== updatedParcel.id)
              }
              
              return updated
            })
          }
        )
        .subscribe()
    }

    // Cleanup subscription on unmount or when user/activeTab changes
    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [userData, activeTab])

  // Mock parcel data - in real app this would come from API
  const mockParcelData = {
    'TRK12345678': {
      id: 'TRK12345678',
      status: 'In Transit',
      location: 'Nairobi, Kenya',
      destination: 'Mombasa, Kenya',
      estimatedDelivery: '2024-01-15',
      currentLocation: 'Nakuru, Kenya',
      lastUpdate: '2024-01-12 14:30'
    }
  }

  const handleTrackParcel = () => {
    if (trackingNumber.trim()) {
      const parcel = mockParcelData[trackingNumber]
      if (parcel) {
        setParcelDetails(parcel)
      } else {
        alert('Tracking number not found. Please check and try again.')
      }
    }
  }

  const calculateCost = (weight, distance, serviceType) => {
    const baseRate = 500 // KES base rate
    const weightRate = weight * 100 // KES per kg
    const distanceRate = distance * 50 // KES per km
    const serviceMultiplier = serviceType === 'express' ? 1.5 : 1.0
    
    return Math.round((baseRate + weightRate + distanceRate) * serviceMultiplier)
  }

  const handleCostCalculation = () => {
    setIsCalculating(true)
    // Simulate API call
    setTimeout(() => {
      const weight = Math.floor(Math.random() * 20) + 1 // 1-20 kg
      const distance = Math.floor(Math.random() * 500) + 50 // 50-550 km
      const serviceType = Math.random() > 0.5 ? 'express' : 'standard'
      
      const cost = calculateCost(weight, distance, serviceType)
      // Generate exactly 8 digits for tracking number
      const randomDigits = Math.floor(Math.random() * 90000000) + 10000000 // 8-digit number
      setCostEstimate({
        weight,
        distance,
        serviceType,
        cost,
        trackingNumber: `TRK${randomDigits}`
      })
      setIsCalculating(false)
    }, 2000)
  }

  const handlePayment = () => {
    // Simulate payment processing
    setTimeout(() => {
      setIsPaymentComplete(true)
      alert('Payment completed successfully! Your parcel will be picked up soon.')
    }, 2000)
  }



  const handleParcelSubmission = async (parcelData) => {
    try {
      // Check if user data is available
      if (!userData?.id) {
        console.error('No user ID available:', userData)
        alert('User authentication error. Please sign in again.')
        return
      }

      // Calculate cost based on weight and distance
      const weight = parseFloat(parcelData.parcelWeight)
      if (isNaN(weight) || weight <= 0) {
        alert('Please enter a valid parcel weight.')
        return
      }

      const distance = Math.floor(Math.random() * 500) + 50 // Simulate distance calculation
      const cost = calculateCost(weight, distance, 'standard')

      // Prepare parcel data matching database schema
      const parcelToSave = {
        tracking_number: parcelData.trackingNumber,
        user_id: userData.id,
        sender_name: parcelData.senderName || userData.name || 'Unknown User',
        sender_email: parcelData.senderEmail || userData.email || '',
        sender_address: parcelData.senderAddress || '',
        sender_county: parcelData.senderCounty || '',
        sender_phone: parcelData.senderPhone || '',
        sender_commuter: parcelData.senderCommuter || '',
        recipient_name: parcelData.recipientName || '',
        recipient_email: parcelData.recipientEmail || '',
        recipient_address: parcelData.recipientAddress || '',
        recipient_county: parcelData.recipientCounty || '',
        recipient_phone: parcelData.recipientPhone || '',
        parcel_description: parcelData.parcelDescription || '',
        parcel_weight: weight,
        parcel_length: parcelData.parcelDimensions ? parseFloat(parcelData.parcelDimensions.split('x')[0]) || null : null,
        parcel_width: parcelData.parcelDimensions ? parseFloat(parcelData.parcelDimensions.split('x')[1]) || null : null,
        parcel_height: parcelData.parcelDimensions ? parseFloat(parcelData.parcelDimensions.split('x')[2]) || null : null,
        special_instructions: parcelData.specialInstructions || '',
        status: parcelData.status || 'Pending Pickup',
        cost: cost,
        estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        current_location: parcelData.senderCounty || '',
        destination: parcelData.recipientCounty || '',
        // Add payment-related fields
        total_cost: parcelData.total_cost || cost,
        payment_method: parcelData.payment_method || 'pay_on_delivery',
        payment_status: parcelData.payment_status || 'pending'
      }

      // Save to Supabase
      const { data, error } = await parcelService.createParcel(parcelToSave)

      if (error) {
        console.error('Error saving parcel:', error)
        alert(`Error submitting parcel: ${error.message || 'Please try again.'}`)
        return
      }

      // Add the submitted parcel to the local state immediately
      const newParcel = {
        id: data?.id || Date.now(),
        tracking_number: parcelData.trackingNumber,
        user_id: userData.id,
        sender_name: parcelData.senderName || userData.name || 'Unknown User',
        sender_address: parcelData.senderAddress,
        sender_county: parcelData.senderCounty,
        sender_phone: parcelData.senderPhone,
        sender_commuter: parcelData.senderCommuter,
        recipient_name: parcelData.recipientName,
        recipient_address: parcelData.recipientAddress,
        recipient_county: parcelData.recipientCounty,
        recipient_phone: parcelData.recipientPhone,
        parcel_description: parcelData.parcelDescription,
        parcel_weight: weight,
        parcel_dimensions: parcelData.parcelDimensions,
        special_instructions: parcelData.specialInstructions,
        cost: cost,
        status: 'Pending Pickup',
        created_at: new Date().toISOString()
      }
      
      console.log('New parcel to add:', newParcel)
      
      setSubmittedParcels(prev => {
        const updatedParcels = [...prev, newParcel]
        console.log('Updated parcels state:', updatedParcels)
        return updatedParcels
      })

      // Switch to track tab to show the new parcel
      setActiveTab('track')

      // Create notification for successful parcel placement
      try {
        await notificationService.createNotification({
          user_id: userData.id,
          title: 'Parcel Placed Successfully! 📦',
          message: `Your parcel has been submitted for delivery. Tracking Number: ${parcelData.trackingNumber}`,
          type: 'success',
          metadata: {
            tracking_number: parcelData.trackingNumber,
            parcel_id: data?.id,
            action: 'parcel_placed'
          }
        })
        console.log('Notification created for parcel placement')
      } catch (notifError) {
        console.error('Error creating notification:', notifError)
        // Don't fail the entire process if notification fails
      }

      // Force refresh parcels from database to ensure consistency
      setTimeout(async () => {
        try {
          const { data, error } = await parcelService.getUserParcels()
          if (!error && data) {
            const userParcels = data?.filter(parcel => parcel.user_id === userData.id) || []
            setSubmittedParcels(userParcels)
            console.log('Refreshed parcels from database:', userParcels)
          }
        } catch (error) {
          console.error('Error refreshing parcels:', error)
        }
      }, 1000)

      // Show success message with tracking number
      alert(`Parcel submitted successfully! Your tracking number is: ${parcelData.trackingNumber}`)
      
      // Return the saved parcel data for payment flow
      return data
    } catch (error) {
      console.error('Error submitting parcel:', error)
      alert(`Error submitting parcel: ${error.message || 'Please try again.'}`)
      throw error // Re-throw so payment flow can handle the error
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending Pickup':
        return 'bg-orange-100 text-orange-800'
      case 'In Transit':
        return 'bg-slate-100 text-slate-800'
      case 'Delivered':
        return 'bg-green-100 text-green-800'
      case 'Cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  // Handle parcel cancellation
  const handleCancelParcel = async (parcelId, trackingNumber) => {
    if (!window.confirm(`Are you sure you want to cancel parcel ${trackingNumber}? This action cannot be undone.`)) {
      return
    }

    try {
      const { data, error } = await parcelService.cancelParcel(parcelId)
      
      if (error) {
        console.error('Error cancelling parcel:', error)
        alert(`Error cancelling parcel: ${error.message}`)
        return
      }

      // Remove the cancelled parcel from user's view immediately
      setSubmittedParcels(prev => 
        prev.filter(parcel => parcel.id !== parcelId)
      )

      alert(`Parcel ${trackingNumber} has been cancelled successfully and removed from your active parcels.`)
    } catch (error) {
      console.error('Error cancelling parcel:', error)
      alert(`Error cancelling parcel: ${error.message}`)
    }
  }

  // Filter parcels based on current user and show active parcels (not picked up yet)
  const getUserParcels = () => {
    if (!userData?.id) return []
    // Show parcels that are still active (not delivered or cancelled)
    const activeParcels = submittedParcels.filter(parcel => 
      parcel.user_id === userData.id && 
      parcel.status !== 'Delivered' &&
      parcel.status !== 'Cancelled'
    )
    console.log('Active parcels for user:', activeParcels)
    return activeParcels
  }

  // Get completed parcels for history
  const getCompletedParcels = () => {
    if (!userData?.id) return []
    return submittedParcels.filter(parcel => 
      parcel.user_id === userData.id && 
      parcel.status === 'Delivered'
    )
  }

  const removeCompletedDelivery = (parcelId) => {
    setSubmittedParcels(prev => prev.filter(parcel => parcel.id !== parcelId))
  }

  const removeAllCompletedDeliveries = () => {
    if (window.confirm('Are you sure you want to remove all completed deliveries? This action cannot be undone.')) {
      setSubmittedParcels(prev => prev.filter(parcel => 
        parcel.user_id !== userData.id || parcel.status !== 'Delivered'
      ))
    }
  }

  const userParcels = getUserParcels()
  const completedParcels = getCompletedParcels()
  
  console.log('Current submittedParcels state:', submittedParcels)
  console.log('Current userParcels:', userParcels)

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
             {/* Delivery Notification */}
       {deliveryNotification && (
         <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg animate-bounce">
           <div className="flex items-center">
             <span className="text-2xl mr-2">🎉</span>
             <div>
               <p className="font-semibold">{deliveryNotification.message}</p>
               <p className="text-sm opacity-90">Will disappear from active parcels in 2 minutes</p>
             </div>
           </div>
         </div>
       )}

       {/* Hero Section */}
       <div className="relative text-center mb-12 overflow-hidden rounded-lg">
         {/* Professional Delivery Background */}
         <div 
           className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
           style={{
             backgroundImage: 'url(/images/professional-delivery-hero.jpg)',
           }}
         ></div>
         
         <div className="relative z-10 py-8 px-6 bg-gradient-to-r from-slate-50/80 to-slate-100/80 rounded-lg">
           <h1 className="text-4xl font-bold text-slate-900 mb-4 drop-shadow-sm">
             Fast & Reliable Parcel Delivery
           </h1>
           <p className="text-xl text-slate-700 mb-8 drop-shadow-sm">
             Track your parcels in real-time and place new delivery requests
           </p>
         </div>
       </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('track')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'track'
                ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Track Parcel
          </button>
          <button
            onClick={() => setActiveTab('place')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'place'
                ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Place Parcel
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => {
              window.location.href = '/history'
            }}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Order History
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'track' && (
        <>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Track Parcel Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Track Your Parcel</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tracking Number
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number (e.g., TRK12345678)"
                      className="flex-1 border border-slate-300 rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                    <button
                      onClick={handleTrackParcel}
                      className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-6 py-2 rounded-r-md hover:from-slate-800 hover:to-slate-950 transition-colors shadow-lg"
                    >
                      Track
                    </button>
                  </div>
                </div>

                {parcelDetails && (
                  <div className="bg-slate-50 rounded-lg p-4 mt-4">
                    <h3 className="font-semibold text-lg mb-2">Parcel Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Status:</span> {parcelDetails.status}</p>
                      <p><span className="font-medium">Current Location:</span> {parcelDetails.currentLocation}</p>
                      <p><span className="font-medium">Destination:</span> {parcelDetails.destination}</p>
                      <p><span className="font-medium">Estimated Delivery:</span> {parcelDetails.estimatedDelivery}</p>
                      <p><span className="font-medium">Last Update:</span> {parcelDetails.lastUpdate}</p>
                    </div>
                    <button className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition-colors">
                      Live Track (Google Maps)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Active Parcels Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Your Active Parcels</h2>
              <p className="text-sm text-slate-600 mb-4">Parcels waiting to be picked up or currently in transit</p>
              <div className="space-y-4">
                {loadingParcels ? (
                  <div className="text-center py-6">
                    <div className="relative w-12 h-12 mx-auto mb-3">
                      <div className="w-12 h-12 border-3 border-slate-200 rounded-full animate-spin border-t-slate-600"></div>
                      <div className="absolute inset-0 w-12 h-12 border-3 border-transparent rounded-full animate-pulse border-t-slate-400"></div>
                    </div>
                    <div className="inline-block">
                      <span className="text-slate-600 font-medium">Loading parcels</span>
                      <span className="text-slate-400 animate-bounce inline-block ml-1">.</span>
                      <span className="text-slate-400 animate-bounce inline-block ml-1" style={{animationDelay: '0.1s'}}>.</span>
                      <span className="text-slate-400 animate-bounce inline-block ml-1" style={{animationDelay: '0.2s'}}>.</span>
                    </div>
                  </div>
                ) : userParcels.length > 0 ? (
                  userParcels.map((parcel) => (
                    <div key={parcel.id} className={`border rounded-lg p-4 transition-all duration-500 ${
                      parcel.status === 'Delivered' 
                        ? 'border-green-300 bg-green-50 animate-pulse' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Tracking Number</p>
                          <h3 className="font-bold text-lg text-slate-600">{parcel.tracking_number}</h3>
                        </div>
                                                 <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(parcel.status)}`}>
                           {parcel.status === 'Pending Pickup' ? 'Awaiting Pickup' : parcel.status}
                         </span>
                      </div>
                                             <div className="space-y-1 text-sm text-slate-600">
                         <div className="grid grid-cols-2 gap-2">
                           <div>
                             <p><span className="font-medium">Sender:</span> {parcel.sender_name}</p>
                             <p><span className="font-medium">Phone:</span> {parcel.sender_phone || 'N/A'}</p>
                             <p><span className="font-medium">County:</span> {parcel.sender_county || 'N/A'}</p>
                             <p><span className="font-medium">Commuter:</span> {parcel.sender_commuter || 'N/A'}</p>
                           </div>
                           <div>
                             <p><span className="font-medium">Recipient:</span> {parcel.recipient_name}</p>
                             <p><span className="font-medium">Phone:</span> {parcel.recipient_phone || 'N/A'}</p>
                             <p><span className="font-medium">County:</span> {parcel.recipient_county || 'N/A'}</p>
                           </div>
                         </div>
                         <div className="mt-2 pt-2 border-t border-slate-200">
                           <p><span className="font-medium">Description:</span> {parcel.parcel_description}</p>
                           <p><span className="font-medium">Weight:</span> {parcel.parcel_weight} kg</p>
                           {parcel.parcel_dimensions && (
                             <p><span className="font-medium">Dimensions:</span> {parcel.parcel_dimensions}</p>
                           )}
                           {parcel.special_instructions && (
                             <p><span className="font-medium">Special Instructions:</span> {parcel.special_instructions}</p>
                           )}
                           <p><span className="font-medium">Cost:</span> KES {parcel.cost?.toLocaleString() || 'Calculating...'}</p>
                         </div>
                         {parcel.status === 'Pending Pickup' && (
                           <p className="text-orange-600 text-xs mt-2">
                             ⏳ Awaiting pickup
                           </p>
                         )}
                         {parcel.status === 'Delivered' && (
                           <p className="text-green-600 text-xs mt-2">
                             ✅ Delivered! Will be removed from active parcels in 2 minutes
                           </p>
                         )}
                         {parcel.status === 'Cancelled' && (
                           <p className="text-red-600 text-xs mt-2">
                             ❌ Cancelled by user
                           </p>
                         )}
                       </div>
                      <div className="mt-3 flex gap-2">
                        <button className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-3 py-1 rounded text-sm hover:from-slate-800 hover:to-slate-950 transition-colors shadow-lg">
                          Track
                        </button>
                        <button className="bg-emerald-600 text-white px-3 py-1 rounded text-sm hover:bg-emerald-700 transition-colors">
                          Live Track
                        </button>
                        {parcel.status === 'Pending Pickup' && (
                          <button 
                            onClick={() => handleCancelParcel(parcel.id, parcel.tracking_number)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <p className="text-slate-500">No active parcels found</p>
                    <p className="text-sm text-slate-400 mt-1">Place a new parcel to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Completed Parcels Section */}
          {completedParcels.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Completed Deliveries</h2>
                  <p className="text-sm text-slate-600">Successfully delivered parcels</p>
                </div>
                <button
                  onClick={removeAllCompletedDeliveries}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
                >
                  Remove All
                </button>
              </div>
              <div className="space-y-4">
                {completedParcels.map((parcel) => (
                  <div key={parcel.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Tracking Number</p>
                        <h3 className="font-bold text-lg text-slate-600">{parcel.tracking_number}</h3>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(parcel.status)}`}>
                        Delivered
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p><span className="font-medium">From:</span> {parcel.sender_name}</p>
                      <p><span className="font-medium">To:</span> {parcel.recipient_name}</p>
                      <p><span className="font-medium">Description:</span> {parcel.parcel_description}</p>
                      <p><span className="font-medium">Weight:</span> {parcel.parcel_weight} kg</p>
                      <p><span className="font-medium">Cost:</span> KES {parcel.cost?.toLocaleString() || 'Calculating...'}</p>
                      <p className="text-green-600 text-xs mt-2">
                        ✅ Successfully delivered
                      </p>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => removeCompletedDelivery(parcel.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'place' && (
        <div>
          <ParcelPlacementForm onSubmit={handleParcelSubmission} />
          
          {/* Cost Calculation Section - appears after placing parcel */}
          {userParcels.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Calculate Shipping Cost</h2>
              <div className="space-y-4">
                {/* Calculate Cost button removed as requested */}

                {costEstimate && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">Cost Estimate</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Weight:</span> {costEstimate.weight} kg</p>
                      <p><span className="font-medium">Distance:</span> {costEstimate.distance} km</p>
                      <p><span className="font-medium">Service:</span> {costEstimate.serviceType}</p>
                      <p><span className="font-medium">Total Cost:</span> KES {costEstimate.cost.toLocaleString()}</p>
                      <p><span className="font-medium">Tracking Number:</span> {costEstimate.trackingNumber}</p>
                    </div>
                    
                    {!isPaymentComplete ? (
                      <button
                        onClick={handlePayment}
                        className="mt-4 bg-gradient-to-r from-slate-700 to-slate-900 text-white px-4 py-2 rounded hover:from-slate-800 hover:to-slate-950 transition-colors shadow-lg"
                      >
                        Proceed to Payment
                      </button>
                    ) : (
                      <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
                        ✅ Payment completed! Your tracking number is: {costEstimate.trackingNumber}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <Profile 
          userData={userData} 
          onBack={() => setActiveTab('track')} 
        />
      )}

      {/* Features Section */}
      <div className="relative mt-12 grid md:grid-cols-3 gap-6 overflow-hidden rounded-lg">
        {/* Subtle background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5"
          style={{
            backgroundImage: 'url(/images/delivery-warehouse.jpg)',
          }}
        ></div>
        
        <div className="relative z-10 text-center bg-white/80 backdrop-blur-sm rounded-lg p-6 hover:transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">📍 Real-time Tracking</h3>
          <p className="text-slate-700">Track your parcels with live updates and GPS location</p>
        </div>

        <div className="relative z-10 text-center bg-white/80 backdrop-blur-sm rounded-lg p-6 hover:transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">💰 Instant Pricing</h3>
          <p className="text-slate-700">Get accurate cost estimates instantly</p>
        </div>

        <div className="relative z-10 text-center bg-white/80 backdrop-blur-sm rounded-lg p-6 hover:transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">⚡ Fast Delivery</h3>
          <p className="text-slate-700">Express and standard delivery options available</p>
        </div>
      </div>

        </div>
      </div>
      
      {/* Simple Footer */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white py-6">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">TrackFlow</h3>
          <p className="text-slate-200 text-sm">© 2025 All rights reserved</p>
        </div>
      </div>
    </div>
  )
}

export default Home