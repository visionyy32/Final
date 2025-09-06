import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { notificationService } from '../services/supabaseService'
import NotificationPanel from './NotificationPanel'

const Navbar = ({ currentPage, setCurrentPage, onSignOut }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [userData, setUserData] = useState(null)

  const navItems = [
    { name: 'Home', page: 'home' },
    { name: 'Track Parcel', page: 'tracking' },
    { name: 'About Us', page: 'about' },
    { name: 'Contact Us', page: 'contact' },
    { name: 'FAQ', page: 'faq' }
  ]

  // Get current user and notification count
  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserData(user)
        loadUnreadCount(user.id)

        // Subscribe to notifications
        const subscription = notificationService.subscribeToNotifications(
          user.id,
          () => loadUnreadCount(user.id)
        )

        return () => {
          subscription.unsubscribe()
        }
      }
    }

    getUserData()
  }, [])

  const loadUnreadCount = async (userId) => {
    try {
      const { count, error } = await notificationService.getUnreadCount(userId)
      if (!error) {
        setUnreadCount(count || 0)
      }
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  const handleSignOut = () => {
    const confirmed = window.confirm('Are you sure you want to sign out?')
    if (confirmed && onSignOut) {
      onSignOut()
    }
  }

  const NotificationIcon = () => (
    <button
      onClick={() => setIsNotificationsOpen(true)}
      className="relative px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 flex items-center gap-2 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus:ring-slate-400"
      style={{ colorScheme: 'light dark' }}
    >
      <span className="sr-only">View notifications</span>
      <svg 
        className="h-5 w-5 transition-colors" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        style={{ color: 'inherit' }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <span className="hidden sm:block">Notifications</span>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-800 animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )

  return (
    <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="ml-2 text-xl font-bold text-slate-900">TrackFlow</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setCurrentPage(item.page)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-in-out transform ${
                    currentPage === item.page
                      ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg scale-105'
                      : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-900 hover:text-white hover:shadow-lg hover:scale-105 active:scale-95'
                  } dark:text-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-800`}
                >
                  {item.name}
                </button>
              ))}
              <NotificationIcon />
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="hidden md:block">
            <button
              onClick={handleSignOut}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:shadow-lg transform hover:scale-105 active:scale-95 ease-in-out"
            >
              Sign Out
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-500"
            >
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setCurrentPage(item.page)
                setIsMenuOpen(false)
              }}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-all duration-300 ease-in-out transform ${
                currentPage === item.page
                  ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg scale-105'
                  : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-900 hover:text-white hover:shadow-lg hover:scale-105 active:scale-95'
              } dark:text-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-800`}
            >
              {item.name}
            </button>
          ))}
          <button
            onClick={() => {
              setIsNotificationsOpen(true)
              setIsMenuOpen(false)
            }}
            className="relative w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 text-slate-700 hover:bg-slate-100 flex items-center gap-2 dark:text-slate-300 dark:hover:bg-slate-700"
            style={{ colorScheme: 'light dark' }}
          >
            <svg 
              className="h-5 w-5 transition-colors" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: 'inherit' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Notifications
            {unreadCount > 0 && (
              <span className="ml-auto h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              handleSignOut()
              setIsMenuOpen(false)
            }}
            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Notifications panel */}
      {userData && (
        <NotificationPanel
          userId={userData.id}
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />
      )}
    </nav>
  )
}

export default Navbar