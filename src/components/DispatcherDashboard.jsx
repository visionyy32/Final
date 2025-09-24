import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { parcelService, userService } from '../services/supabaseService'
import PaymentModal from './PaymentModal'

const DispatcherDashboard = ({ onSignOut }) => {
  const [activeTab, setActiveTab] = useState('available') // Default to available parcels
  const [parcels, setParcels] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedParcel, setSelectedParcel] = useState(null)
  const [statusUpdate, setStatusUpdate] = useState('')
  const [locationUpdate, setLocationUpdate] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentParcel, setPaymentParcel] = useState(null)

  console.log('DispatcherDashboard rendered:', { activeTab, parcels: parcels.length, users: users.length, loading, error })

  // Enhanced sign out handler with confirmation
  const handleSignOut = () => {
    const confirmed = window.confirm(
      '🚪 Sign Out Confirmation\n\n' +
      'Are you sure you want to sign out from the Dispatcher Dashboard?\n\n' +
      'This will:\n' +
      '• End your current session\n' +
      '• Return you to the landing page\n' +
      '• Keep your session data for easier re-login\n\n' +
      'You can sign back in quickly with your saved credentials.'
    )
    
    if (confirmed) {
      console.log('🚪 Dispatcher confirmed sign out (session data preserved)')
      onSignOut()
    } else {
      console.log('🚫 Dispatcher cancelled sign out')
    }
  }

  // Handle payment collection
  const handleCollectPayment = (parcel) => {
    console.log('Collecting payment for parcel:', parcel)
    setPaymentParcel({
      ...parcel,
      type: 'regular',
      recipient_phone: parcel.recipient_phone || parcel.recipientPhone
    })
    setShowPaymentModal(true)
  }

  // Handle payment success
  const handlePaymentSuccess = async (paymentData) => {
    console.log('Payment collected successfully:', paymentData)
    
    try {
      // Update parcel status to delivered since payment is complete
      const { error } = await parcelService.updateParcelStatus(paymentParcel.id, 'Delivered')
      
      if (error) {
        console.error('Error updating parcel status after payment:', error)
        alert('Payment successful but failed to update parcel status. Please refresh and try again.')
      } else {
        alert('Payment collected successfully! Parcel marked as delivered.')
        // Reload data to reflect changes
        loadData()
      }
    } catch (error) {
      console.error('Error in handlePaymentSuccess:', error)
      alert('Payment successful but there was an error updating the system. Please refresh.')
    }
    
    setShowPaymentModal(false)
    setPaymentParcel(null)
  }

  // Load data on component mount and set up auto-refresh
  useEffect(() => {
    loadData()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing dispatcher data...')
      loadData()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Helper function to get user info for a parcel
  const getUserForParcel = (parcelUserId) => {
    return users.find(user => user.id === parcelUserId) || {
      name: 'Unknown User',
      email: 'N/A',
      phone: 'N/A'
    }
  }

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return amount ? `KSh ${parseInt(amount).toLocaleString()}` : 'TBD'
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🚚 Loading dispatcher dashboard - fetching all parcels...')
      
      // Try multiple approaches to get data
      let parcelsData = []
      let usersData = []
      
      // Approach 1: Try service method first
      try {
        const parcelsResult = await parcelService.getAllParcels()
        if (!parcelsResult.error) {
          parcelsData = parcelsResult.data || []
          console.log('✅ Service method successful:', parcelsData.length, 'parcels loaded')
        } else {
          throw new Error(parcelsResult.error.message)
        }
      } catch (serviceError) {
        console.log('⚠️ Service method failed, trying direct query...', serviceError.message)
        
        // Approach 2: Direct query - enhanced with more fields
        try {
          const { data: directData, error: directError } = await supabase
            .from('parcels')
            .select(`
              id,
              tracking_number,
              recipient_name,
              recipient_address,
              recipient_county,
              recipient_phone,
              sender_name,
              sender_address,
              sender_phone,
              sender_county,
              parcel_description,
              parcel_weight,
              status,
              cost,
              total_cost,
              shipping_cost,
              payment_method,
              payment_status,
              mpesa_transaction_id,
              estimated_delivery,
              current_location,
              created_at,
              updated_at,
              user_id
            `)
            .order('created_at', { ascending: false })
            .limit(200)
          
          if (directError) {
            throw new Error(directError.message)
          }
          
          parcelsData = directData || []
          console.log('✅ Direct query successful:', parcelsData.length, 'parcels loaded')
          
          // Log parcel status distribution for debugging
          const statusCounts = parcelsData.reduce((acc, parcel) => {
            const status = parcel.status || 'undefined'
            acc[status] = (acc[status] || 0) + 1
            return acc
          }, {})
          console.log('📊 Parcel status distribution:', statusCounts)
          
        } catch (directError) {
          console.log('❌ Direct query also failed:', directError.message)
          throw new Error(`Database access blocked by RLS policies. Error: ${serviceError.message}`)
        }
      }
      
      // Load user data for better parcel context
      try {
        const usersResult = await userService.getAllUsers()
        if (!usersResult.error) {
          usersData = usersResult.data || []
          console.log('✅ Users loaded via service:', usersData.length)
        } else {
          // Fallback to direct query
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, name, email, phone, role')
            .limit(100)
          
          if (!userError) {
            usersData = userData || []
            console.log('✅ Users loaded via direct query:', usersData.length)
          } else {
            console.warn('⚠️ Could not load users:', userError.message)
          }
        }
      } catch (userError) {
        console.warn('⚠️ Users query failed, continuing without user data:', userError.message)
      }
      
      setParcels(parcelsData)
      setUsers(usersData)
      
      console.log('🎉 Dispatcher dashboard data loaded successfully!')
      console.log('📦 Total parcels:', parcelsData.length)
      console.log('👥 Total users:', usersData.length)
      console.log('🟢 Available parcels:', parcelsData.filter(p => p.status === 'Pending Pickup' || !p.status).length)
      console.log('🔵 Active parcels:', parcelsData.filter(p => p.status === 'In Transit').length)
      
    } catch (error) {
      console.error('All data loading approaches failed:', error)
      setError(`Database connection failed: ${error.message}. 
      
To fix this, run this SQL in Supabase:
ALTER TABLE public.parcels DISABLE ROW LEVEL SECURITY;

Or use the Table Editor to turn off RLS on the parcels table.`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateParcel = async (parcelId) => {
    if (!selectedParcel || !statusUpdate) {
      alert('Please select a status to update')
      return
    }

    try {
      const { error } = await parcelService.updateParcelStatus(parcelId, statusUpdate)
      
      if (error) {
        throw new Error(error.message)
      }

      // Update location if provided
      if (locationUpdate) {
        // Note: We need to add a method to update location, for now just log it
        console.log('Location update:', locationUpdate)
      }

      // Refresh parcel data
      await loadData()
      setSelectedParcel(null)
      setStatusUpdate('')
      setLocationUpdate('')
      alert('Parcel updated successfully!')
    } catch (error) {
      console.error('Error updating parcel:', error)
      alert(`Update failed: ${error.message}`)
    }
  }

  // Helper functions to categorize parcels
  const getAvailableParcels = () => {
    // Available parcels are those that are pending pickup or newly created
    return parcels.filter(parcel => 
      parcel.status === 'Pending Pickup' || 
      parcel.status === 'pending' ||
      parcel.status === null
    )
  }

  const getActiveParcels = () => {
    // Active parcels are those currently being serviced by dispatcher
    return parcels.filter(parcel => 
      parcel.status === 'In Transit' || 
      parcel.status === 'picked_up' ||
      parcel.status === 'in_transit'
    )
  }

  const handleAssignParcel = async (parcelId) => {
    try {
      const { error } = await parcelService.updateParcelStatus(parcelId, 'In Transit')
      
      if (error) {
        throw new Error(error.message)
      }

      // Refresh parcel data
      await loadData()
      alert('Parcel assigned successfully!')
    } catch (error) {
      console.error('Error assigning parcel:', error)
      alert(`Assignment failed: ${error.message}`)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending Pickup': return 'bg-yellow-100 text-yellow-800'
      case 'In Transit': return 'bg-blue-100 text-blue-800'
      case 'Delivered': return 'bg-green-100 text-green-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Dispatcher Dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Dashboard Error</h3>
          <p className="text-red-700 mb-4">Error loading dashboard: {error}</p>
          <div className="space-y-2">
            <button
              onClick={loadData}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Retry Loading Data
            </button>
            <button
              onClick={handleSignOut}
              className="w-full bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Simple test version
  try {

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center mr-4">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">TrackFlow Dispatcher</h1>
                <p className="text-slate-600">Manage parcels and logistics • {parcels.length} total parcels</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadData}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </>
                )}
              </button>
              <button
                onClick={handleSignOut}
                className="bg-gradient-to-r from-slate-600 to-slate-800 text-white px-6 py-2 rounded-xl font-medium hover:from-slate-700 hover:to-slate-900 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-slate-200 mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('available')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'available'
                  ? 'border-slate-500 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Available Parcels ({getAvailableParcels().length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'active'
                  ? 'border-slate-500 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Active Parcels ({getActiveParcels().length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-slate-500 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'available' && (
          <div className="space-y-6">
            {/* Stats Cards for Available Parcels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                <h3 className="text-sm font-medium text-slate-600">Available Parcels</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">{getAvailableParcels().length}</p>
                <p className="text-xs text-slate-500 mt-1">Ready for pickup</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                <h3 className="text-sm font-medium text-slate-600">Pending Pickup</h3>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {parcels.filter(p => p.status === 'Pending Pickup').length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Awaiting collection</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                <h3 className="text-sm font-medium text-slate-600">Total Orders</h3>
                <p className="text-3xl font-bold text-slate-900 mt-2">{parcels.length}</p>
                <p className="text-xs text-slate-500 mt-1">All parcels</p>
              </div>
            </div>

            {/* Available Parcels Table */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Available Parcels</h2>
                <p className="text-sm text-slate-600">Parcels placed by users that need to be picked up</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Tracking & Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Placed By (User)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Sender Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Recipient & Delivery
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Fee & Weight
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {getAvailableParcels().map((parcel) => {
                      const placedByUser = getUserForParcel(parcel.user_id);
                      return (
                      <tr key={parcel.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900">
                            {parcel.tracking_number}
                          </div>
                          <div className="text-sm text-slate-500">
                            {parcel.parcel_description}
                          </div>
                          <div className="text-xs text-slate-400">
                            Created: {new Date(parcel.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-blue-600">{placedByUser.name}</div>
                          <div className="text-sm text-slate-500">{placedByUser.email}</div>
                          <div className="text-xs text-slate-400">{placedByUser.phone}</div>
                          <div className="text-xs text-slate-400">Customer</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900">{parcel.sender_name}</div>
                          <div className="text-sm text-slate-500">{parcel.sender_phone}</div>
                          <div className="text-xs text-slate-400">{parcel.sender_address}</div>
                          <div className="text-xs text-slate-400">{parcel.sender_county}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900">{parcel.recipient_name}</div>
                          <div className="text-sm text-slate-500">{parcel.recipient_phone}</div>
                          <div className="text-xs text-slate-400">{parcel.recipient_address}</div>
                          <div className="text-xs text-slate-400">{parcel.recipient_county}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(parcel.cost)}
                          </div>
                          <div className="text-sm text-slate-500">{parcel.parcel_weight}kg</div>
                          {parcel.estimated_delivery && (
                            <div className="text-xs text-slate-400">
                              Est: {new Date(parcel.estimated_delivery).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(parcel.status)}`}>
                            {parcel.status?.replace('_', ' ') || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleAssignParcel(parcel.id)}
                            className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-xs font-medium"
                          >
                            Assign to Me
                          </button>
                        </td>
                      </tr>
                    )})}
                    {getAvailableParcels().length === 0 && (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                          No available parcels at the moment
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'active' && (
          <div className="space-y-6">
            {/* Stats Cards for Active Parcels */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                <h3 className="text-sm font-medium text-slate-600">Active Parcels</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">{getActiveParcels().length}</p>
                <p className="text-xs text-slate-500 mt-1">Currently servicing</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                <h3 className="text-sm font-medium text-slate-600">Picked Up</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {parcels.filter(p => p.status === 'In Transit').length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Collected</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                <h3 className="text-sm font-medium text-slate-600">In Transit</h3>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {parcels.filter(p => p.status === 'In Transit').length}
                </p>
                <p className="text-xs text-slate-500 mt-1">On the way</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                <h3 className="text-sm font-medium text-slate-600">Delivered</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {parcels.filter(p => p.status === 'Delivered').length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Completed</p>
              </div>
            </div>

            {/* Active Parcels Table */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Active Parcels</h2>
                <p className="text-sm text-slate-600">Parcels you are currently servicing</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Tracking & Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Placed By (User)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Sender Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Recipient & Delivery
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Fee & Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {getActiveParcels().map((parcel) => {
                      const placedByUser = getUserForParcel(parcel.user_id);
                      return (
                      <tr key={parcel.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900">
                            {parcel.tracking_number}
                          </div>
                          <div className="text-sm text-slate-500">
                            {parcel.parcel_description}
                          </div>
                          <div className="text-xs text-slate-400">
                            Weight: {parcel.parcel_weight}kg
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-blue-600">{placedByUser.name}</div>
                          <div className="text-sm text-slate-500">{placedByUser.email}</div>
                          <div className="text-xs text-slate-400">{placedByUser.phone}</div>
                          <div className="text-xs text-slate-400">Customer</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900">{parcel.sender_name}</div>
                          <div className="text-sm text-slate-500">{parcel.sender_phone}</div>
                          <div className="text-xs text-slate-400">{parcel.sender_address}</div>
                          <div className="text-xs text-slate-400">{parcel.sender_county}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900">{parcel.recipient_name}</div>
                          <div className="text-sm text-slate-500">{parcel.recipient_phone}</div>
                          <div className="text-xs text-slate-400">{parcel.recipient_address}</div>
                          <div className="text-xs text-slate-400">{parcel.recipient_county}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(parcel.cost)}
                          </div>
                          <div className="text-sm text-slate-500">
                            Current: {parcel.current_location || 'Not set'}
                          </div>
                          {parcel.estimated_delivery && (
                            <div className="text-xs text-slate-400">
                              Est: {new Date(parcel.estimated_delivery).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(parcel.status)}`}>
                            {parcel.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col space-y-1">
                            <button
                              onClick={() => setSelectedParcel(parcel)}
                              className="text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg transition-colors text-xs"
                            >
                              Update
                            </button>
                            {/* Show collect payment button for pay on delivery parcels */}
                            {(parcel.payment_method === 'pay_on_delivery' || !parcel.payment_method) && 
                             (parcel.payment_status === 'pending' || !parcel.payment_status) && (
                              <button
                                onClick={() => handleCollectPayment(parcel)}
                                className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg transition-colors text-xs font-medium"
                                title={`Collect KSh ${parcel.total_cost || parcel.shippingCost || 0} via M-Pesa`}
                              >
                                Collect Payment
                              </button>
                            )}
                            {/* Show payment status for paid parcels */}
                            {parcel.payment_status === 'completed' && (
                              <span className="text-green-600 text-xs font-medium px-2 py-1 bg-green-50 rounded">
                                ✓ Paid
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )})}
                    {getActiveParcels().length === 0 && (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                          No active parcels. Check Available Parcels to start servicing.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Parcel Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900">{parcels.length}</div>
                  <div className="text-sm text-slate-600">Total Parcels</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900">
                    {getAvailableParcels().length}
                  </div>
                  <div className="text-sm text-slate-600">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900">
                    {getActiveParcels().length}
                  </div>
                  <div className="text-sm text-slate-600">In Progress</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Update Parcel Modal */}
      {selectedParcel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              Update Parcel: {selectedParcel.tracking_number}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="">Select status</option>
                  <option value="Pending Pickup">Pending Pickup</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Current Location</label>
                <input
                  type="text"
                  value={locationUpdate}
                  onChange={(e) => setLocationUpdate(e.target.value)}
                  placeholder="Enter current location"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleUpdateParcel(selectedParcel.id)}
                className="flex-1 bg-slate-600 text-white py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Update
              </button>
              <button
                onClick={() => {
                  setSelectedParcel(null)
                  setStatusUpdate('')
                  setLocationUpdate('')
                }}
                className="flex-1 bg-slate-100 text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Collection Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false)
          setPaymentParcel(null)
        }}
        parcel={paymentParcel}
        onPaymentSuccess={handlePaymentSuccess}
        initiatedBy="dispatcher"
      />
    </div>
  )
  } catch (renderError) {
    console.error('Dispatcher Dashboard render error:', renderError)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Render Error</h3>
          <p className="text-red-700 mb-4">Something went wrong rendering the dashboard.</p>
          <button
            onClick={handleSignOut}
            className="w-full bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }
}

export default DispatcherDashboard
