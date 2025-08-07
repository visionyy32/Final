import { useState, useEffect } from 'react'

const LandingPage = ({ onSignIn, onSignUp }) => {
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [signInData, setSignInData] = useState({ email: '', password: '', role: 'user' })
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [trackingNumber, setTrackingNumber] = useState('')
  
  const images = [
    '/images/landing1.jpg',
    '/images/landing2.jpg',
    '/images/landing3.jpg'
  ]

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000) // Change image every 5 seconds

    return () => clearInterval(interval)
  }, [images.length])

  const handleSignIn = (e) => {
    e.preventDefault()
    // Here you would typically validate and send to backend
    onSignIn(signInData)
    setIsSignInOpen(false)
    setSignInData({ email: '', password: '', role: 'user' })
  }

  const handleTrackPackage = (e) => {
    e.preventDefault()
    if (trackingNumber.trim()) {
      // Here you would typically navigate to tracking page
      console.log('Tracking:', trackingNumber)
      // For now, just show an alert
      alert(`Tracking package: ${trackingNumber}`)
    }
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* All content with relative positioning */}
      <div className="relative z-10">
        {/* Navigation - Enhanced with glassmorphism */}
        <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200/50 sticky top-0 z-50 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center group">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <span className="ml-3 text-xl font-bold text-slate-900 tracking-tight">TrackFlow</span>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setIsSignInOpen(true)}
                  className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:from-slate-800 hover:to-slate-950 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Enhanced Hero Section with Full Content */}
        <div className="relative h-[600px] overflow-hidden bg-slate-900">
          {/* Images with enhanced transitions */}
          {images.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                currentImageIndex === index ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={image}
                alt={`Landing slide ${index + 1}`}
                className="w-full h-full object-cover scale-125"
                style={{
                  objectPosition: 'center 25%',
                  filter: 'brightness(0.85) contrast(1.1)'
                }}
              />
              {/* Enhanced gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-slate-800/40 to-transparent"></div>
            </div>
          ))}

          {/* Enhanced Navigation Dots */}
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex space-x-4">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-4 h-4 rounded-full transition-all duration-500 ${
                  currentImageIndex === index
                    ? 'bg-white scale-125 shadow-2xl ring-2 ring-white/50'
                    : 'bg-white/50 hover:bg-white/75 hover:scale-110'
                }`}
              />
            ))}
          </div>

          {/* Enhanced Arrow Navigation */}
          <button
            onClick={() => setCurrentImageIndex(
              currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1
            )}
            className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition-all duration-300 backdrop-blur-lg border border-white/20 hover:scale-110 group"
          >
            <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={() => setCurrentImageIndex(
              currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1
            )}
            className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition-all duration-300 backdrop-blur-lg border border-white/20 hover:scale-110 group"
          >
            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Enhanced Hero Content with Full Layout */}
          <div className="absolute inset-0 flex items-center justify-start z-20">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
              <div className="max-w-2xl">
                <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
                  <span className="block">TrackFlow</span>
                  <span className="block text-3xl lg:text-4xl font-light text-slate-200 mt-2">
                    Kenya's Premier Delivery Network
                  </span>
                </h1>
                <p className="text-xl text-slate-100 mb-8 leading-relaxed">
                  Fast, reliable, and secure parcel delivery across all 47 counties. 
                  Track your packages in real-time with our advanced logistics platform.
                </p>
                
                {/* Enhanced Track Section */}
                <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Track Your Package</h3>
                  <form onSubmit={handleTrackPackage} className="flex gap-3">
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter 8-digit tracking number"
                      className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-300 text-slate-900 placeholder-slate-500"
                      maxLength={8}
                    />
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-8 py-3 rounded-xl font-semibold hover:from-slate-800 hover:to-slate-950 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 whitespace-nowrap"
                    >
                      Track Now
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About TrackFlow Section - Original Layout with Enhanced Colors */}
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Image on the left */}
              <div className="relative">
                <img
                  src="/images/Real-time-updates.jpg"
                  alt="Real time updates"
                  className="w-full h-[400px] object-cover rounded-lg shadow-xl"
                />
              </div>
              
              {/* Description on the right */}
              <div className="space-y-4">
                <p className="text-base text-slate-800 leading-relaxed font-medium">
                  Connecting Kenya, One Package at a Time. TrackFlow is transforming how businesses 
                  and individuals move goods across the nation with our comprehensive transport and logistics 
                  solutions.
                </p>
                
                {/* Mission & Vision */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <h3 className="text-base font-semibold text-slate-900 mb-1">Our Mission</h3>
                    <p className="text-xs text-slate-700">To provide reliable, efficient transport and logistics solutions that connect businesses and individuals across Kenya.</p>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                    <h3 className="text-base font-semibold text-emerald-900 mb-1">Our Vision</h3>
                    <p className="text-xs text-emerald-700">To be the leading logistics network in East Africa, setting the standard for innovation and customer satisfaction.</p>
                  </div>
                </div>
                
                {/* Services */}
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 bg-slate-800 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white font-bold text-xs">•</span>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">Transport & Logistics</h4>
                      <p className="text-xs text-slate-600">Complete logistics solutions including freight, warehousing, and distribution services.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 bg-slate-800 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white font-bold text-xs">•</span>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">Real-Time Tracking</h4>
                      <p className="text-xs text-slate-600">GPS tracking system for complete visibility of your shipments.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 bg-slate-800 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white font-bold text-xs">•</span>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">Nationwide Coverage</h4>
                      <p className="text-xs text-slate-600">Comprehensive coverage across all 47 counties with local expertise.</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2">
                  <button
                    onClick={() => setIsSignInOpen(true)}
                    className="bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Get Started Today
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Sign In Modal */}
      {isSignInOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-slate-200 transform transition-all duration-300 scale-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-white font-bold text-2xl">T</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
              <p className="text-slate-600 mt-2">Sign in to your TrackFlow account</p>
            </div>
            
            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Email Address</label>
                <input
                  type="email"
                  value={signInData.email}
                  onChange={(e) => setSignInData({...signInData, email: e.target.value})}
                  required
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-300 text-slate-900"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Password</label>
                <input
                  type="password"
                  value={signInData.password}
                  onChange={(e) => setSignInData({...signInData, password: e.target.value})}
                  required
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-300 text-slate-900"
                  placeholder="Enter your password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Account Type</label>
                <select
                  value={signInData.role}
                  onChange={(e) => setSignInData({...signInData, role: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-300 text-slate-900"
                >
                  <option value="user">Customer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-slate-700 to-slate-900 text-white py-3 px-6 rounded-xl font-semibold hover:from-slate-800 hover:to-slate-950 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignInOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 px-6 rounded-xl font-semibold hover:bg-slate-200 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LandingPage 