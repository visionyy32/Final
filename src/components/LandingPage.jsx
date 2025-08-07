import { useState, useEffect } from 'react'

const LandingPage = ({ onSignIn, onSignUp }) => {
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [signInData, setSignInData] = useState({ email: '', password: '', role: 'user' })
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
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

  return (
    <div className="min-h-screen relative bg-gray-100">
      {/* All content with relative positioning */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">TrackFlow</span>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setIsSignInOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Animated Image Carousel */}
        <div className="relative h-[500px] overflow-hidden bg-gray-900">
          {/* Images with fade transition - perfectly positioned for faces */}
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
                  filter: 'brightness(1.1) contrast(1.05)'
                }}
              />
              {/* Lighter overlay to keep faces visible */}
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            </div>
          ))}

          {/* Navigation Dots */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentImageIndex === index
                    ? 'bg-white scale-125 shadow-lg'
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
              />
            ))}
          </div>

          {/* Optional: Left/Right Arrow Navigation */}
          <button
            onClick={() => setCurrentImageIndex(
              currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1
            )}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={() => setCurrentImageIndex(
              currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1
            )}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* TrackFlow Branding - Positioned to not cover faces */}
          <div className="absolute bottom-16 left-8 text-white z-10">
            <h1 className="text-4xl font-bold mb-2 drop-shadow-2xl">TrackFlow</h1>
            <p className="text-lg drop-shadow-lg">Professional Parcel Delivery Services</p>
          </div>
        </div>

        {/* About TrackFlow Section */}
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
                <p className="text-base text-gray-800 leading-relaxed font-medium">
                  Connecting Kenya, One Package at a Time. TrackFlow is transforming how businesses 
                  and individuals move goods across the nation with our comprehensive transport and logistics 
                  solutions.
                </p>
                
                {/* Mission & Vision */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h3 className="text-base font-semibold text-blue-900 mb-1">Our Mission</h3>
                    <p className="text-xs text-blue-700">To provide reliable, efficient transport and logistics solutions that connect businesses and individuals across Kenya.</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h3 className="text-base font-semibold text-green-900 mb-1">Our Vision</h3>
                    <p className="text-xs text-green-700">To be the leading logistics network in East Africa, setting the standard for innovation and customer satisfaction.</p>
                  </div>
                </div>
                
                {/* Services */}
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white font-bold text-xs">•</span>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">Transport & Logistics</h4>
                      <p className="text-xs text-gray-600">Complete logistics solutions including freight, warehousing, and distribution services.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white font-bold text-xs">•</span>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">Real-Time Tracking</h4>
                      <p className="text-xs text-gray-600">GPS tracking system for complete visibility of your shipments.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white font-bold text-xs">•</span>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">Nationwide Coverage</h4>
                      <p className="text-xs text-gray-600">Comprehensive coverage across all 47 counties with local expertise.</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2">
                  <button
                    onClick={() => setIsSignInOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Get Started Today
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>      {/* Sign In Modal */}
      {isSignInOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Sign In</h2>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={signInData.email}
                  onChange={(e) => setSignInData({...signInData, email: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={signInData.password}
                  onChange={(e) => setSignInData({...signInData, password: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={signInData.role}
                  onChange={(e) => setSignInData({...signInData, role: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignInOpen(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
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