const AboutUs = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">About TrackFlow</h1>
        <p className="text-xl text-slate-600">Your trusted partner in reliable parcel delivery across Kenya</p>
      </div>

      {/* Founder Section */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8 hover:shadow-xl transition-shadow">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Meet Our Founder</h2>
            <h3 className="text-2xl font-semibold text-slate-600 mb-4">CEDRICK KIPKURUI</h3>
            <p className="text-slate-600 mb-4">
                             CEDRICK KIPKURUI is a visionary entrepreneur who recognized the growing need for reliable, 
               efficient parcel delivery services in Kenya. With over 8 years of experience in logistics 
               and technology, CEDRICK founded TrackFlow with a mission to revolutionize the delivery 
               industry in East Africa.
            </p>
            <p className="text-slate-600 mb-4">
                             His background in computer science and logistics management has enabled him to create 
               innovative solutions that combine cutting-edge technology with traditional delivery methods. 
               CEDRICK's commitment to customer satisfaction and operational excellence has made 
               TrackFlow the preferred choice for businesses and individuals across Kenya.
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-slate-600">8+ Years Experience</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-slate-600">Computer Science Background</span>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="w-48 h-48 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-6xl font-bold">CK</span>
            </div>
            <p className="text-slate-600">CEDRICK KIPKURUI</p>
            <p className="text-sm text-slate-500">Founder & CEO</p>
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-lg shadow-lg p-8 mb-8 text-white hover:shadow-xl transition-shadow">
                 <h2 className="text-3xl font-bold mb-6 text-center">Why Choose TrackFlow?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Fast & Reliable</h3>
            <p className="text-slate-200">Express delivery options with guaranteed delivery times</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure & Safe</h3>
            <p className="text-slate-200">Advanced tracking and insurance for all parcels</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Nationwide Coverage</h3>
            <p className="text-slate-200">Serving all major cities and towns across Kenya</p>
          </div>
        </div>
      </div>

      {/* Our Services */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8 hover:shadow-xl transition-shadow">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">Our Services</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-slate-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Express Delivery</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Same-day and next-day delivery options for urgent parcels. Perfect for time-sensitive 
              documents and packages.
            </p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Same-day delivery in major cities</li>
              <li>• Next-day delivery nationwide</li>
              <li>• Real-time tracking updates</li>
            </ul>
          </div>

          <div className="border border-slate-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Standard Delivery</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Cost-effective delivery service with 2-3 business days delivery time. Ideal for 
              regular shipments and bulk orders.
            </p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• 2-3 business days delivery</li>
              <li>• Cost-effective pricing</li>
              <li>• Bulk shipping discounts</li>
            </ul>
          </div>

          <div className="border border-slate-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Fragile & Valuable Items</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Specialized handling for fragile, valuable, and sensitive items with additional 
              insurance coverage.
            </p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Specialized packaging</li>
              <li>• Extra insurance coverage</li>
              <li>• Careful handling procedures</li>
            </ul>
          </div>

          <div className="border border-slate-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Business Solutions</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Customized delivery solutions for businesses with volume discounts and dedicated 
              account management.
            </p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Volume discounts</li>
              <li>• Dedicated account manager</li>
              <li>• Custom delivery schedules</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Company Stats */}
      <div className="bg-slate-50 rounded-lg p-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">Our Numbers</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-600 mb-2">50,000+</div>
            <div className="text-slate-600">Parcels Delivered</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600 mb-2">47</div>
            <div className="text-slate-600">Counties Covered</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-600 mb-2">98%</div>
            <div className="text-slate-600">Customer Satisfaction</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-600 mb-2">24/7</div>
            <div className="text-slate-600">Customer Support</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutUs 