import { useState, useEffect } from 'react'
import SpecialDeliveryBooking from './SpecialDeliveryBooking'
import ColdChainBooking from './ColdChainBooking'
import InternationalShippingBooking from './InternationalShippingBooking'

// Simple fade-in animation utility
const fadeInClass = 'transition-opacity duration-1000 ease-in opacity-0 animate-fadein';

// Add keyframes for fade-in animation
const style = document.createElement('style');
style.innerHTML = `@keyframes fadein { to { opacity: 1; } } .animate-fadein { animation: fadein 1s forwards; }`;
if (typeof window !== 'undefined' && !document.getElementById('fadein-keyframes')) {
  style.id = 'fadein-keyframes';
  document.head.appendChild(style);
}

const LandingPage = ({ onSignIn, onSignUp }) => {
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isSignUpOpen, setIsSignUpOpen] = useState(false)
  const [signInData, setSignInData] = useState({ email: '', password: '', role: 'user' })
  const [signUpData, setSignUpData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    phone: '', 
    role: 'user' 
  })
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [activeSection, setActiveSection] = useState('home')
  const [currentView, setCurrentView] = useState('home') // New state for home/about toggle
  
  // Special delivery booking states
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [isColdChainOpen, setIsColdChainOpen] = useState(false)
  const [isInternationalOpen, setIsInternationalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState(null)
  const [bookingSuccess, setBookingSuccess] = useState(null)
  
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

  // Scroll detection for active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'services']
      const scrollPosition = window.scrollY + 200

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        const element = section === 'home' ? 
          document.querySelector('.relative.h-\\[600px\\]') : 
          document.getElementById(section)
        
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(section)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignIn = (e) => {
    e.preventDefault()
    // Here you would typically validate and send to backend
    onSignIn(signInData)
    setIsSignInOpen(false)
    setSignInData({ email: '', password: '', role: 'user' })
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    
    // Validate passwords match
    if (signUpData.password !== signUpData.confirmPassword) {
      alert('Passwords do not match')
      return
    }

    // Validate password strength
    if (signUpData.password.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }

    try {
      await onSignUp(signUpData)
      setIsSignUpOpen(false)
      setSignUpData({ 
        name: '', 
        email: '', 
        password: '', 
        confirmPassword: '',
        phone: '', 
        role: 'user' 
      })
    } catch (error) {
      console.error('Sign up error:', error)
    }
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

  // Smooth scroll to section
  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId)
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      })
    }
  }

  // Handle navigation clicks
  const handleNavClick = (section) => {
    if (section === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setActiveSection('home')
    } else {
      scrollToSection(section)
    }
  }

  // Handle special delivery booking
  const handleBookingOpen = (serviceType, serviceName) => {
    if (serviceType === 'cold_chain') {
      setIsColdChainOpen(true)
    } else if (serviceType === 'international_shipping') {
      setIsInternationalOpen(true)
    } else {
      setSelectedService({ type: serviceType, name: serviceName })
      setIsBookingOpen(true)
    }
  }

  const handleBookingSuccess = (orderData, orderNumber, isGuest) => {
    setBookingSuccess({
      orderNumber,
      service: selectedService?.name || 'Cold Chain Logistics',
      cost: orderData.total_cost,
      isGuest
    })
    setIsBookingOpen(false)
    setIsColdChainOpen(false)
    
    // Show success message for 8 seconds (longer for guests)
    setTimeout(() => {
      setBookingSuccess(null)
    }, 8000)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Main content grows to fill space */}
      <div className="flex-1 flex flex-col">
        {/* All content with relative positioning */}
        <div className="relative z-10">
          {/* Navigation - Enhanced with glassmorphism */}
        <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200/50 sticky top-0 z-50 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center group">
                {/* Animated logo */}
                <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 animate-bounce">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12l2 2 4-4" />
                  </svg>
                </div>
                <span className="ml-3 text-xl font-bold text-slate-900 tracking-tight">TrackFlow</span>
              </div>
              <div className="flex items-center space-x-8">
                <nav className="hidden md:flex space-x-8">
                  <button 
                    onClick={() => {
                      handleNavClick('home');
                      setCurrentView('home');
                    }}
                    className={`font-medium px-3 py-2 rounded-md transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                      activeSection === 'home' && currentView === 'home'
                        ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg' 
                        : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-900 hover:text-white hover:shadow-lg'
                    }`}
                  >
                    Home
                  </button>
                  <button 
                    onClick={() => setCurrentView('about')}
                    className={`font-medium px-3 py-2 rounded-md transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                      currentView === 'about' 
                        ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg' 
                        : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-900 hover:text-white hover:shadow-lg'
                    }`}
                  >
                    About
                  </button>
                  <button 
                    onClick={() => handleNavClick('services')}
                    className={`font-medium px-3 py-2 rounded-md transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                      activeSection === 'services' 
                        ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg' 
                        : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-900 hover:text-white hover:shadow-lg'
                    }`}
                  >
                    Services
                  </button>
                </nav>
                {/* Enhanced Navigation with animations */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setIsSignUpOpen(true)}
                    className="border border-slate-300 text-slate-700 px-6 py-2.5 rounded-xl text-sm font-semibold hover:border-slate-500 hover:text-slate-900 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 ease-in-out"
                  >
                    Sign Up
                  </button>
                  <button
                    onClick={() => setIsSignInOpen(true)}
                    className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:from-slate-600 hover:to-slate-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 ease-in-out"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Enhanced Hero Section with Full Content - HOME */}
        <div id="home" className="relative h-[600px] overflow-hidden bg-slate-900">
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
                <h1 className={`text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tight opacity-0 animate-fadein`} style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                  <span className="block">TrackFlow</span>
                  <span className="block text-3xl lg:text-4xl font-light text-slate-200 mt-2">
                    Kenya's Premier Delivery Network
                  </span>
                </h1>
                <p className="text-xl text-slate-100 mb-8 leading-relaxed opacity-0 animate-fadein" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
                  Fast, reliable, and secure parcel delivery across all 47 counties. 
                  Track your packages in real-time with our advanced logistics platform.
                </p>
                {/* Enhanced Track Section */}
                <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 opacity-0 animate-fadein" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Track Your Package</h3>
                  <form onSubmit={handleTrackPackage} className="flex gap-3 flex-col sm:flex-row">
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
      {/* Testimonials Section */}
      <div id="testimonials" className="py-16 bg-gradient-to-br from-slate-100 via-white to-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-10">What Our Customers Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center border border-slate-100">
              <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Customer 1" className="w-16 h-16 rounded-full mb-4 shadow" />
              <p className="text-slate-700 mb-3">"TrackFlow made my business deliveries seamless and stress-free. Real-time tracking is a game changer!"</p>
              <span className="font-semibold text-slate-900">James K., Nairobi</span>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center border border-slate-100">
              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Customer 2" className="w-16 h-16 rounded-full mb-4 shadow" />
              <p className="text-slate-700 mb-3">"Fast, reliable, and always on time. I trust TrackFlow for all my important parcels."</p>
              <span className="font-semibold text-slate-900">Amina M., Mombasa</span>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center border border-slate-100">
              <img src="https://randomuser.me/api/portraits/men/65.jpg" alt="Customer 3" className="w-16 h-16 rounded-full mb-4 shadow" />
              <p className="text-slate-700 mb-3">"Excellent customer support and easy to use platform. Highly recommended!"</p>
              <span className="font-semibold text-slate-900">Peter O., Kisumu</span>
            </div>
          </div>
        </div>
      </div>
      </div> {/* End flex-1 main content */}
      </div>

      </div>
      
      {/* Services Section */}
      <div id="services" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Our Services Make Your Business Secure
            </h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-gray-600 leading-relaxed">
                TrackFlow was founded in 2023 as an innovative logistics company dedicated to 
                revolutionizing package delivery across Kenya. In just under two years, 
                TrackFlow has emerged as a trusted independent courier service, leveraging 
                cutting-edge technology and modern logistics solutions. Our state-of-the-art 
                tracking system and commitment to reliability has quickly established us as 
                a leader in real-time package monitoring and secure delivery services 
                throughout all 47 counties of Kenya.
              </p>
            </div>
          </div>

          {/* Mission and Vision Section */}
          <div className="mt-16 mb-16">
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Mission */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl hover:border-slate-200 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 ease-out cursor-pointer group">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-slate-800 transition-colors duration-300">Our Mission</h3>
                </div>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                  To revolutionize logistics in Kenya by providing reliable, secure, and innovative 
                  delivery solutions that connect communities across all 47 counties. We are committed 
                  to leveraging cutting-edge technology to ensure every package reaches its destination 
                  safely and on time, while building trust through transparency and exceptional service.
                </p>
              </div>

              {/* Vision */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl hover:border-slate-200 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 ease-out cursor-pointer group">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-slate-800 transition-colors duration-300">Our Vision</h3>
                </div>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                  To become East Africa's leading independent logistics provider, setting the standard 
                  for innovation, reliability, and customer satisfaction in the delivery industry. We 
                  envision a future where distance is no barrier to commerce, and every business, 
                  from small enterprises to large corporations, has access to world-class delivery services.
                </p>
              </div>
            </div>
          </div>

          {/* Services Grid - Enhanced with Images */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Parcel & Document Service */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              {/* Service Image */}
              <div className="relative h-64 bg-gradient-to-br from-amber-400 to-orange-500">
                <img
                  src="/images/services.jpeg"
                  alt="Parcel and Document Delivery"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <div className="absolute top-6 left-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 9h6m-6 6h6" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Service Content */}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Parcel & Document Delivery</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Fast, secure, and reliable delivery of packages and important documents across Kenya. 
                  Whether it's business documents, personal packages, or time-sensitive materials, 
                  we ensure your items reach their destination safely and on time.
                </p>
                
                {/* Service Features */}
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Same-day and next-day delivery options
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Real-time tracking and notifications
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Secure handling and insurance coverage
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Door-to-door pickup and delivery
                  </div>
                </div>
                
                {/* Pricing Badge */}
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-2xl font-bold text-slate-700">From KSh 150</span>
                  <button className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-6 py-2 rounded-lg font-semibold hover:from-slate-800 hover:to-slate-950 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                    Learn More
                  </button>
                </div>
              </div>
            </div>

            {/* Freight Service */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              {/* Service Image */}
              <div className="relative h-64 bg-gradient-to-br from-blue-400 to-indigo-500">
                <img
                  src="/images/freightandcargo.jpg"
                  alt="Freight and Cargo Logistics"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <div className="absolute top-6 left-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Service Content */}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Freight & Cargo</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Comprehensive freight solutions for businesses of all sizes. From small cargo 
                  to large shipments, we provide efficient transportation services with complete 
                  logistics support, warehousing, and distribution across Kenya and East Africa.
                </p>
                
                {/* Service Features */}
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Road, air, and sea freight options
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Warehousing and distribution services
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Customs clearance assistance
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Flexible scheduling and routing
                  </div>
                </div>
                
                {/* Pricing Badge */}
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-2xl font-bold text-slate-700">Custom Quote</span>
                  <button className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-6 py-2 rounded-lg font-semibold hover:from-slate-800 hover:to-slate-950 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                    Get Quote
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Services Section */}
          <div className="mt-20">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">Additional Services</h3>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Express Delivery */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                {/* Service Image */}
                <div className="relative h-48 bg-gradient-to-br from-orange-400 to-yellow-500">
                  <img
                    src="/images/fastdev.jpeg"
                    alt="Express Delivery Service"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>
                
                {/* Service Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Express Delivery</h3>
                  <p className="text-gray-600 leading-relaxed mb-4 text-sm">
                    Urgent deliveries within 2-6 hours in major cities. Perfect for time-critical documents and packages.
                  </p>
                  
                  {/* Service Features */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-xs text-gray-700">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      2-6 hour delivery guarantee
                    </div>
                    <div className="flex items-center text-xs text-gray-700">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Real-time tracking
                    </div>
                    <div className="flex items-center text-xs text-gray-700">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Priority handling
                    </div>
                  </div>
                  
                  {/* Pricing Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-slate-700">From KSh 300</span>
                    <button 
                      onClick={() => handleBookingOpen('express_delivery', 'Express Delivery')}
                      className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-4 py-1.5 rounded-lg font-semibold hover:from-slate-800 hover:to-slate-950 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 text-sm"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Cold Chain */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                {/* Service Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-400 to-cyan-500">
                  <img
                    src="/images/cooldelivery.jpeg"
                    alt="Cold Chain Logistics"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>
                
                {/* Service Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Cold Chain Logistics</h3>
                  <p className="text-gray-600 leading-relaxed mb-4 text-sm">
                    Temperature-controlled transportation for pharmaceuticals, food products, and sensitive materials requiring specific climate conditions.
                  </p>
                  
                  {/* Service Features */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-xs text-gray-700">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Temperature monitoring
                    </div>
                    <div className="flex items-center text-xs text-gray-700">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Pharmaceutical grade
                    </div>
                    <div className="flex items-center text-xs text-gray-700">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Freezer & refrigerated
                    </div>
                  </div>
                  
                  {/* Pricing Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-slate-700">Custom Quote</span>
                    <button 
                      onClick={() => handleBookingOpen('cold_chain', 'Cold Chain Logistics')}
                      className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-4 py-1.5 rounded-lg font-semibold hover:from-slate-800 hover:to-slate-950 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 text-sm"
                    >
                      Get Quote
                    </button>
                  </div>
                </div>
              </div>

              {/* International */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                {/* Service Image */}
                <div className="relative h-48 bg-gradient-to-br from-green-400 to-emerald-500">
                  <img
                    src="/images/internationalshipping.jpg"
                    alt="International Shipping"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>
                
                {/* Service Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">International Shipping</h3>
                  <p className="text-gray-600 leading-relaxed mb-4 text-sm">
                    Cross-border logistics solutions connecting Kenya with regional and global markets via air, sea, and land transport.
                  </p>
                  
                  {/* Service Features */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-xs text-gray-700">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Air, sea & land freight
                    </div>
                    <div className="flex items-center text-xs text-gray-700">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Customs clearance
                    </div>
                    <div className="flex items-center text-xs text-gray-700">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Global network
                    </div>
                  </div>
                  
                  {/* Pricing Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-slate-700">Contact Us</span>
                    <button 
                      onClick={() => handleBookingOpen('international_shipping', 'International Shipping')}
                      className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-4 py-1.5 rounded-lg font-semibold hover:from-slate-800 hover:to-slate-950 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 text-sm"
                    >
                      Get Quote
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Sign In Modal */}
      {isSignInOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={(e) => e.target === e.currentTarget && setIsSignInOpen(false)}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl border border-slate-200 transform transition-all duration-300 scale-100 animate-[fadeInScale_0.3s_ease-out] relative">
            {/* Close button */}
            <button
              onClick={() => setIsSignInOpen(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-xl font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all duration-200"
            >
              ×
            </button>
            
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Welcome Back</h2>
              <p className="text-slate-600 text-sm">Sign in to your TrackFlow account</p>
            </div>
            
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={signInData.email}
                  onChange={(e) => setSignInData({...signInData, email: e.target.value})}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 text-slate-900 bg-white"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={signInData.password}
                  onChange={(e) => setSignInData({...signInData, password: e.target.value})}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 text-slate-900 bg-white"
                  placeholder="Enter your password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Type</label>
                <select
                  value={signInData.role}
                  onChange={(e) => setSignInData({...signInData, role: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 text-slate-900 bg-white"
                >
                  <option value="user">Customer</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-slate-700 to-slate-900 text-white py-2.5 px-4 rounded-lg text-sm font-semibold hover:from-slate-800 hover:to-slate-950 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignInOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-700 py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-all duration-200 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Sign Up Modal */}
      {isSignUpOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && setIsSignUpOpen(false)}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl border border-slate-200 transform transition-all duration-300 scale-100 animate-[fadeInScale_0.3s_ease-out] relative my-8">
            {/* Close button */}
            <button
              onClick={() => setIsSignUpOpen(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-xl font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all duration-200"
            >
              ×
            </button>
            
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Join TrackFlow</h2>
              <p className="text-slate-600 text-sm">Create your account to get started</p>
            </div>
            
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={signUpData.name}
                  onChange={(e) => setSignUpData({...signUpData, name: e.target.value})}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 text-slate-900 bg-white"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={signUpData.email}
                  onChange={(e) => setSignUpData({...signUpData, email: e.target.value})}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 text-slate-900 bg-white"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={signUpData.phone}
                  onChange={(e) => setSignUpData({...signUpData, phone: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 text-slate-900 bg-white"
                  placeholder="Phone number (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Type</label>
                <select
                  value={signUpData.role}
                  onChange={(e) => setSignUpData({...signUpData, role: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 text-slate-900 bg-white"
                >
                  <option value="user">Customer</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({...signUpData, password: e.target.value})}
                    required
                    minLength={6}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 text-slate-900 bg-white"
                    placeholder="Min. 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={signUpData.confirmPassword}
                    onChange={(e) => setSignUpData({...signUpData, confirmPassword: e.target.value})}
                    required
                    minLength={6}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 text-slate-900 bg-white"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-slate-700 to-slate-900 text-white py-2.5 px-4 rounded-lg text-sm font-semibold hover:from-slate-800 hover:to-slate-950 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignUpOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-700 py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-all duration-200 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
              <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border-4 border-white">
                <span className="text-white font-bold text-3xl">T</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Join TrackFlow</h2>
              <p className="text-slate-600 text-lg">Create your account to get started</p>
            </div>
            
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-base font-semibold text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={signUpData.name}
                  onChange={(e) => setSignUpData({...signUpData, name: e.target.value})}
                  required
                  className="w-full border-2 border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-600 transition-all duration-300 text-slate-900 bg-slate-50 hover:bg-white"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-slate-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={signUpData.email}
                  onChange={(e) => setSignUpData({...signUpData, email: e.target.value})}
                  required
                  className="w-full border-2 border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-600 transition-all duration-300 text-slate-900 bg-slate-50 hover:bg-white"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-slate-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={signUpData.phone}
                  onChange={(e) => setSignUpData({...signUpData, phone: e.target.value})}
                  className="w-full border-2 border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-600 transition-all duration-300 text-slate-900 bg-slate-50 hover:bg-white"
                  placeholder="Enter your phone number (optional)"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-slate-700 mb-2">Account Type</label>
                <select
                  value={signUpData.role}
                  onChange={(e) => setSignUpData({...signUpData, role: e.target.value})}
                  className="w-full border-2 border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-600 transition-all duration-300 text-slate-900 bg-slate-50 hover:bg-white"
                >
                  <option value="user">Customer</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-semibold text-slate-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({...signUpData, password: e.target.value})}
                    required
                    minLength={6}
                    className="w-full border-2 border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-600 transition-all duration-300 text-slate-900 bg-slate-50 hover:bg-white"
                    placeholder="Min. 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-base font-semibold text-slate-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={signUpData.confirmPassword}
                    onChange={(e) => setSignUpData({...signUpData, confirmPassword: e.target.value})}
                    required
                    minLength={6}
                    className="w-full border-2 border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-600 transition-all duration-300 text-slate-900 bg-slate-50 hover:bg-white"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-slate-700 to-slate-900 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:from-slate-800 hover:to-slate-950 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 transform active:scale-95"
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignUpOpen(false)}
                  className="flex-1 bg-slate-200 text-slate-700 py-4 px-6 rounded-xl text-lg font-semibold hover:bg-slate-300 transition-all duration-300 border-2 border-slate-300 hover:border-slate-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Special Delivery Booking Dialog */}
      {selectedService && (
        <SpecialDeliveryBooking
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          serviceType={selectedService.type}
          serviceName={selectedService.name}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* Cold Chain Booking Dialog */}
      <ColdChainBooking
        isOpen={isColdChainOpen}
        onClose={() => setIsColdChainOpen(false)}
        onSuccess={handleBookingSuccess}
      />

      {/* International Shipping Booking Dialog */}
      <InternationalShippingBooking
        isOpen={isInternationalOpen}
        onClose={() => setIsInternationalOpen(false)}
        onSuccess={handleBookingSuccess}
      />

      {/* Booking Success Message */}
      {bookingSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white p-6 rounded-lg shadow-xl z-50 max-w-md">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-green-200 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-bold text-lg mb-1">Booking Successful!</h3>
              <p className="text-green-100 text-sm mb-2">
                Your {bookingSuccess.service} order has been created.
              </p>
              <p className="text-green-100 text-sm">
                <span className="font-semibold">Order Number:</span> {bookingSuccess.orderNumber}
              </p>
              <p className="text-green-100 text-sm">
                <span className="font-semibold">Total Cost:</span> KSh {bookingSuccess.cost}
              </p>
              <div className="mt-3 p-2 bg-green-400 rounded text-green-900 text-xs">
                <p className="font-semibold">📧 Confirmation Email Sent!</p>
                <p>Check your email for detailed instructions on bringing your parcel to our TrackFlow office.</p>
                <p className="mt-1">📍 Office: Mombasa Road, Industrial Area, Nairobi</p>
              </div>
              {bookingSuccess.isGuest && (
                <div className="mt-2 p-2 bg-green-400 rounded text-green-900 text-xs">
                  <p className="font-semibold">📝 Important:</p>
                  <p>Save your order number! You can also track your order without an account.</p>
                  <p className="mt-1">💡 Create an account for easier order management.</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setBookingSuccess(null)}
              className="ml-auto text-green-200 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Compact Professional Footer - System Color Theme */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/5 to-blue-600/10"></div>
          <div className="absolute top-5 left-10 w-20 h-20 bg-blue-600/5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-5 right-10 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            
            {/* Company Info - Compact */}
            <div className="lg:col-span-1 space-y-2">
              <div>
                <h3 className="text-xl font-bold mb-1 text-blue-400">
                  TrackFlow
                </h3>
                <div className="w-10 h-0.5 bg-blue-600 rounded-full mb-2"></div>
                <p className="text-gray-300 leading-snug text-xs">
                  Kenya's premier logistics partner for express delivery, cold chain, and international shipping.
                </p>
              </div>
              
              {/* Compact Contact Info */}
              <div className="space-y-1.5">
                <div className="flex items-center text-xs">
                  <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <span className="text-gray-300">Nairobi, Kenya</span>
                </div>
                
                <div className="flex items-center text-xs">
                  <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <span className="text-gray-300">0703748709</span>
                </div>
                
                <div className="flex items-center text-xs">
                  <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-gray-300">info@trackflow.co.ke</span>
                </div>
              </div>
            </div>

            {/* Quick Links - Compact */}
            <div className="space-y-2">
              <h4 className="text-base font-semibold text-white relative">
                Quick Links
                <div className="w-5 h-0.5 bg-blue-600 absolute -bottom-0.5 left-0"></div>
              </h4>
              <ul className="space-y-1">
                {[
                  { name: 'Our Services', href: '#services' },
                  { name: 'Track Parcel', href: '/tracking' },
                  { name: 'About Us', href: '/about' },
                  { name: 'Contact', href: '/contact' }
                ].map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.href} 
                      className="text-gray-300 hover:text-blue-400 transition-all duration-200 flex items-center group text-xs"
                    >
                      <div className="w-1 h-1 bg-blue-600 rounded-full mr-2 group-hover:w-3 transition-all duration-200"></div>
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services - Compact */}
            <div className="space-y-2">
              <h4 className="text-base font-semibold text-white relative">
                Services
                <div className="w-5 h-0.5 bg-blue-600 absolute -bottom-0.5 left-0"></div>
              </h4>
              <ul className="space-y-1">
                {[
                  { name: 'Express Delivery', icon: '' },
                  { name: 'Cold Chain', icon: '' },
                  { name: 'International', icon: '' },
                  { name: 'Same Day', icon: '' }
                ].map((service, index) => (
                  <li key={index} className="flex items-center text-gray-300 text-xs group cursor-pointer">
                    <span className="mr-2 group-hover:scale-110 transition-transform text-sm">{service.icon}</span>
                    <span className="group-hover:text-blue-400 transition-colors">{service.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social & Newsletter - Compact */}
            <div className="space-y-2">
              <div>
                <h4 className="text-base font-semibold text-white relative mb-2">
                  Connect
                  <div className="w-5 h-0.5 bg-blue-600 absolute -bottom-0.5 left-0"></div>
                </h4>
                
                {/* Compact Newsletter */}
                <div className="mb-3">
                  <div className="flex">
                    <input 
                      type="email" 
                      placeholder="Email..." 
                      className="flex-1 px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-l-md text-white placeholder-gray-400 focus:outline-none focus:border-blue-600 transition-colors text-xs"
                    />
                    <button className="px-3 py-1.5 bg-blue-600 rounded-r-md hover:bg-blue-700 transition-all duration-200 transform hover:scale-105">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Compact Social Media */}
                <div className="flex space-x-2">
                  <a 
                    href="https://www.instagram.com/trackflow47?igsh=YjcyYnY4MnBnbDg2" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center hover:bg-pink-600 hover:shadow-md hover:shadow-pink-500/25 transform hover:scale-110 hover:-rotate-3 transition-all duration-200"
                  >
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a 
                    href="https://www.facebook.com/trackflow" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25 transform hover:scale-110 hover:rotate-3 transition-all duration-200"
                  >
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a 
                    href="https://twitter.com/trackflow_ke" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 hover:shadow-md hover:shadow-gray-500/25 transform hover:scale-110 hover:-rotate-3 transition-all duration-200"
                  >
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                  <a 
                    href="https://www.linkedin.com/company/trackflow" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25 transform hover:scale-110 hover:rotate-3 transition-all duration-200"
                  >
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Bottom Bar */}
          <div className="border-t border-gray-800/50 mt-4 pt-3">
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-1 lg:space-y-0">
              <div className="flex flex-col lg:flex-row items-center space-y-1 lg:space-y-0 lg:space-x-4">
                <p className="text-gray-400 text-xs">&copy; 2025 TrackFlow. All rights reserved.</p>
              </div>
              <div className="flex items-center space-x-1 text-gray-400 text-xs">
                <span>Made with</span>
                <span className="text-red-500 animate-pulse">❤️</span>
                <span>in Kenya</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage