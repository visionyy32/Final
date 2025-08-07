import { useState } from 'react'

const ParcelTracking = () => {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [parcelDetails, setParcelDetails] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Mock parcel data with more detailed tracking information
  const mockParcelData = {
    'TRK12345678': {
      id: 'TRK12345678',
      status: 'In Transit',
      location: 'Nairobi, Kenya',
      destination: 'Mombasa, Kenya',
      estimatedDelivery: '2024-01-15',
      currentLocation: 'Nakuru, Kenya',
      lastUpdate: '2024-01-12 14:30',
      sender: 'John Doe',
      recipient: 'Jane Smith',
      weight: '2.5 kg',
      service: 'Express Delivery',
      trackingHistory: [
        {
          date: '2024-01-12 14:30',
          location: 'Nakuru, Kenya',
          status: 'In Transit',
          description: 'Package picked up from sorting facility'
        },
        {
          date: '2024-01-12 10:15',
          location: 'Nairobi, Kenya',
          status: 'Departed',
          description: 'Package departed from origin facility'
        },
        {
          date: '2024-01-12 08:30',
          location: 'Nairobi, Kenya',
          status: 'Picked Up',
          description: 'Package picked up from sender'
        },
        {
          date: '2024-01-11 16:45',
          location: 'Nairobi, Kenya',
          status: 'Order Confirmed',
          description: 'Order received and confirmed'
        }
      ]
    }
  }

  const handleTrackParcel = () => {
    if (trackingNumber.trim()) {
      setIsLoading(true)
      // Simulate API call
      setTimeout(() => {
        const parcel = mockParcelData[trackingNumber]
        if (parcel) {
          setParcelDetails(parcel)
        } else {
          alert('Tracking number not found. Please check and try again.')
        }
        setIsLoading(false)
      }, 1500)
    }
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'text-green-600 bg-green-100'
      case 'in transit':
        return 'text-slate-600 bg-slate-100'
      case 'picked up':
        return 'text-purple-600 bg-purple-100'
      case 'departed':
        return 'text-orange-600 bg-orange-100'
      default:
        return 'text-slate-600 bg-slate-100'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Track Your Parcel</h1>
        <p className="text-xl text-slate-600">Real-time tracking updates and delivery status</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Tracking Input */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Enter Tracking Number</h2>
            
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
                    disabled={isLoading}
                    className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-6 py-2 rounded-r-md hover:from-slate-800 hover:to-slate-950 transition-colors disabled:opacity-50 shadow-lg"
                  >
                    {isLoading ? 'Tracking...' : 'Track'}
                  </button>
                </div>
              </div>

              <div className="text-sm text-slate-600">
                <p>Try tracking number: <span className="font-mono bg-slate-100 px-2 py-1 rounded">TRK12345678</span></p>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="mt-8 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-2">Tracking Tips</h3>
              <ul className="text-sm text-slate-800 space-y-1">
                <li>• Enter your tracking number exactly as provided</li>
                <li>• Tracking updates every 30 minutes</li>
                <li>• Contact us if tracking shows no updates for 24 hours</li>
                <li>• Use our mobile app for push notifications</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tracking Results */}
        <div className="lg:col-span-2">
          {parcelDetails ? (
            <div className="space-y-6">
              {/* Parcel Summary */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">Parcel Details</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(parcelDetails.status)}`}>
                    {parcelDetails.status}
                  </span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Parcel Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Tracking Number:</span> {parcelDetails.id}</p>
                      <p><span className="font-medium">Service:</span> {parcelDetails.service}</p>
                      <p><span className="font-medium">Weight:</span> {parcelDetails.weight}</p>
                      <p><span className="font-medium">Estimated Delivery:</span> {parcelDetails.estimatedDelivery}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Delivery Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">From:</span> {parcelDetails.sender}</p>
                      <p><span className="font-medium">To:</span> {parcelDetails.recipient}</p>
                      <p><span className="font-medium">Origin:</span> {parcelDetails.location}</p>
                      <p><span className="font-medium">Destination:</span> {parcelDetails.destination}</p>
                    </div>
                  </div>
                </div>

                {/* Live Track Button */}
                <div className="mt-6">
                  <button className="w-full bg-emerald-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-emerald-700 transition-colors">
                    🗺️ Live Track on Google Maps
                  </button>
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    Click to open real-time location tracking on Google Maps
                  </p>
                </div>
              </div>

              {/* Tracking Timeline */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Tracking Timeline</h3>
                
                <div className="space-y-4">
                  {parcelDetails.trackingHistory.map((event, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className={`w-4 h-4 rounded-full ${index === 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        {index < parcelDetails.trackingHistory.length - 1 && (
                          <div className="w-0.5 h-8 bg-slate-300 ml-2"></div>
                        )}
                      </div>
                      
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-slate-900">{event.status}</h4>
                          <span className="text-sm text-slate-500">{event.date}</span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{event.location}</p>
                        <p className="text-sm text-slate-500 mt-1">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Location Map Placeholder */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Current Location</h3>
                <div className="bg-slate-100 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                    </svg>
                    <p className="text-slate-600">Google Maps integration will be implemented here</p>
                    <p className="text-sm text-slate-500 mt-2">Current location: {parcelDetails.currentLocation}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <svg className="w-24 h-24 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
              </svg>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Enter a Tracking Number</h3>
              <p className="text-slate-600">Enter your tracking number above to see real-time updates and delivery status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ParcelTracking 