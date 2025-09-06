import { useState } from 'react'

const SimpleDispatcherDashboard = ({ onSignOut }) => {
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
                <p className="text-slate-600">Dashboard Loading...</p>
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="bg-gradient-to-r from-slate-600 to-slate-800 text-white px-6 py-2 rounded-xl font-medium hover:from-slate-700 hover:to-slate-900 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Dispatcher Dashboard</h2>
          <p className="text-slate-600 mb-6">
            Welcome to the dispatcher dashboard. The full dashboard is being loaded.
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900">Available Parcels</h3>
              <p className="text-blue-700 text-sm">View parcels ready for pickup</p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900">Active Parcels</h3>
              <p className="text-purple-700 text-sm">Manage parcels you're currently servicing</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900">Analytics</h3>
              <p className="text-green-700 text-sm">View delivery statistics and reports</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SimpleDispatcherDashboard
