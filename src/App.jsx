import { useState, useEffect, useLayoutEffect } from 'react'
import { supabase } from './lib/supabase'
import { authService } from './services/supabaseService'
import LandingPage from './components/LandingPage'
import Navbar from './components/Navbar'
import Home from './components/Home'
import AboutUs from './components/AboutUs'
import ContactUs from './components/ContactUs'
import ParcelTracking from './components/ParcelTracking'
import FAQ from './components/FAQ'
import AdminDashboard from './components/AdminDashboard'

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true) // Start with loading state
  const [authInitialized, setAuthInitialized] = useState(false)
  const [isRoleChecking, setIsRoleChecking] = useState(false) // New state for role checking

  // Get current page from URL
  const getCurrentPageFromURL = () => {
    const path = window.location.pathname
    if (path === '/' || path === '') return 'home'
    const page = path.substring(1) // Remove leading slash
    
    // Validate page exists
    const validPages = ['home', 'about', 'contact', 'tracking', 'faq', 'admin', 'landing']
    return validPages.includes(page) ? page : 'home'
  }

  // Update URL when page changes
  const navigateToPage = (page) => {
    const url = page === 'home' ? '/' : `/${page}`
    window.history.pushState(null, '', url)
    setCurrentPage(page)
  }

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const page = getCurrentPageFromURL()
      setCurrentPage(page)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Handle visibility change to prevent unnecessary auth checks
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && userRole === 'admin') {
        console.log('Tab became visible, preserving admin state')
        // Force admin page if admin user
        if (currentPage !== 'admin') {
          setCurrentPage('admin')
          navigateToPage('admin')
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isAuthenticated, userRole, currentPage])

  // Initialize page from URL on load
  useEffect(() => {
    const page = getCurrentPageFromURL()
    setCurrentPage(page)
  }, [])

  // Check for existing authentication session
  useEffect(() => {
    setIsLoading(true) // Ensure loading state is active
    
    const checkAuth = async () => {
      try {
        // Use a more efficient auth check with timeout
        const authPromise = authService.getCurrentUser()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 3000) // 3 second timeout
        )
        
        const { user, error } = await Promise.race([authPromise, timeoutPromise])
        
        if (error && error.message !== 'Auth timeout') {
          console.error('Auth check error:', error)
        }

        if (user) {
          // User has an existing session - fetch profile with timeout
          try {
            const profilePromise = authService.getUserProfile(user.id)
            const profileTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile timeout')), 2000) // 2 second timeout
            )
            
            const { data: profile, error: profileError } = await Promise.race([
              profilePromise, 
              profileTimeoutPromise
            ])
            
            let userRole = 'user' // default
            if (!profileError && profile?.role) {
              userRole = profile.role
              // Cache the role for session persistence
              localStorage.setItem(`userRole_${user.id}`, profile.role)
            } else {
              // Try to get cached role if profile fetch failed
              const cachedRole = localStorage.getItem(`userRole_${user.id}`)
              if (cachedRole) {
                userRole = cachedRole
              }
            }

            // Prepare all user data
            const newUserData = {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || profile?.name || user.email,
              role: userRole
            }

            // Set all states in the correct order to prevent intermediate renders
            const updateBatch = () => {
              // Set role first, then authentication state
              setUserRole(userRole)
              setIsAuthenticated(true)
              setUserData(newUserData)
              
              if (userRole === 'admin') {
                setCurrentPage('admin')
                navigateToPage('admin')
              } else {
                // Only set page to home if we're on landing page
                const currentURLPage = getCurrentPageFromURL()
                if (currentURLPage === 'landing' || currentURLPage === 'home') {
                  setCurrentPage('home')
                  navigateToPage('home')
                }
              }
            }

            // Execute batch update
            updateBatch()
            
          } catch (error) {
            console.error('Error during initial auth check:', error)
            // Fallback to default user handling - batch update
            const fallbackUpdate = () => {
              setIsAuthenticated(true)
              setUserRole('user')
              setUserData({
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name || user.email,
                role: 'user'
              })
              
              const currentURLPage = getCurrentPageFromURL()
              if (currentURLPage === 'landing' || currentURLPage === 'home') {
                setCurrentPage('home')
                navigateToPage('home')
              }
            }
            
            fallbackUpdate()
          }
        } else {
          // No authenticated user - batch update
          const noAuthUpdate = () => {
            setIsAuthenticated(false)
            setUserRole(null)
            setUserData(null)
            const currentURLPage = getCurrentPageFromURL()
            if (currentURLPage !== 'landing') {
              setCurrentPage('landing')
              navigateToPage('landing')
            }
          }
          
          noAuthUpdate()
        }
      } catch (error) {
        console.error('Auth check error:', error)
        // On error, ensure we're on landing page quickly - batch update
        const errorUpdate = () => {
          setIsAuthenticated(false)
          setUserRole(null)
          setUserData(null)
          setCurrentPage('landing')
          navigateToPage('landing')
        }
        
        errorUpdate()
      } finally {
        // Minimum loading time of 500ms for smooth transition but prevent flickering
        setTimeout(() => {
          setIsLoading(false)
          setAuthInitialized(true)
        }, 500)
      }
    }

    checkAuth()

    // Set up auth state listener for real-time changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only handle auth changes after initial auth is complete
      if (!authInitialized) return
      
      console.log('Auth state change:', event, session?.user?.id)
      
      // CRITICAL: If we already have an admin user, prevent any state changes during token refresh
      if (event === 'TOKEN_REFRESHED' && isAuthenticated && userRole === 'admin' && userData?.id === session?.user?.id) {
        console.log('Token refreshed for admin, maintaining admin state')
        return
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Check if this is just a token refresh and we already have the user data
        if (isAuthenticated && userData?.id === session.user.id && userRole) {
          console.log('Token refresh detected, preserving existing state for:', userRole)
          return // Don't change anything, just preserve current state
        }
        
        // If we already have admin state, don't show loading - preserve admin state
        if (userRole === 'admin' && isAuthenticated && userData?.id === session.user.id) {
          console.log('Admin state preserved, no loading screen')
          return
        }
        
        setIsLoading(true) // Show loading during transition
        
        // Check if we have cached role data in localStorage
        const cachedRole = localStorage.getItem(`userRole_${session.user.id}`)
        
        // Fetch user profile with timeout for faster response
        try {
          const profilePromise = authService.getUserProfile(session.user.id)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile timeout')), 1500) // 1.5 second timeout
          )
          
          const { data: profile, error: profileError } = await Promise.race([
            profilePromise, 
            timeoutPromise
          ])
          
          // Prioritize cached role, then profile role, then default
          let userRole = cachedRole || (profile?.role) || 'user'
          
          // Cache the role for future use
          if (profile?.role) {
            localStorage.setItem(`userRole_${session.user.id}`, profile.role)
            userRole = profile.role
          }

          // Prepare all user data
          const newUserData = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || profile?.name || session.user.email,
            role: userRole
          }

          // Batch update all states to prevent intermediate renders
          const authUpdateBatch = () => {
            setUserRole(userRole)
            setIsAuthenticated(true)
            setUserData(newUserData)
            
            if (userRole === 'admin') {
              setCurrentPage('admin')
              navigateToPage('admin')
            } else {
              // Only navigate to home if we're on landing page
              const currentURLPage = getCurrentPageFromURL()
              if (currentURLPage === 'landing') {
                setCurrentPage('home')
                navigateToPage('home')
              }
            }
          }

          // Execute batch update
          authUpdateBatch()
          
        } catch (error) {
          console.error('Error during auth state change:', error)
          
          // Use cached role if available, otherwise fallback to user
          const fallbackRole = cachedRole || 'user'
          
          // Fallback to cached/default user role quickly - batch update
          const fallbackBatch = () => {
            setUserRole(fallbackRole)
            setIsAuthenticated(true)
            setUserData({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || session.user.email,
              role: fallbackRole
            })
            
            if (fallbackRole === 'admin') {
              setCurrentPage('admin')
              navigateToPage('admin')
            } else {
              const currentURLPage = getCurrentPageFromURL()
              if (currentURLPage === 'landing') {
                setCurrentPage('home')
                navigateToPage('home')
              }
            }
          }
          
          fallbackBatch()
        } finally {
          // Shorter loading time for auth state changes
          setTimeout(() => {
            setIsLoading(false)
          }, 200)
        }
      } else if (event === 'SIGNED_OUT') {
        // Clear cached role data
        if (userData?.id) {
          localStorage.removeItem(`userRole_${userData.id}`)
        }
        
        // User signed out - batch update immediately
        const signOutBatch = () => {
          setIsAuthenticated(false)
          setUserRole(null)
          setUserData(null)
          setCurrentPage('landing')
          navigateToPage('landing')
        }
        
        signOutBatch()
      }
    })

    return () => subscription.unsubscribe()
  }, [authInitialized])

  const handleSignIn = async (signInData) => {
    try {
      console.log('Attempting to sign in with:', { email: signInData.email })
      
      // Set loading state to prevent flickering
      setIsLoading(true)
      
      const { data, error } = await authService.signIn(signInData.email, signInData.password)
      
      if (error) {
        console.error('Sign in error details:', error)
        setIsLoading(false)
        alert(`Sign in error: ${error.message}`)
        return
      }

      console.log('Sign in successful:', data)

      if (data.user) {
        // Prepare user data
        const newUserData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email,
          role: signInData.role || 'user'
        }

        // Batch update all states to prevent intermediate renders
        const signInBatch = () => {
          setUserRole(signInData.role || 'user')
          setIsAuthenticated(true)
          setUserData(newUserData)
          
          if (signInData.role === 'admin') {
            setCurrentPage('admin')
            navigateToPage('admin')
          } else {
            setCurrentPage('home')
            navigateToPage('home')
          }
        }

        // Execute batch update
        signInBatch()

        // Fetch user profile in background (non-blocking)
        authService.getUserProfile(data.user.id).then(({ data: profile, error: profileError }) => {
          if (profileError) {
            console.error('Error getting user profile:', profileError)
            // Profile will be created automatically by the service if needed
          } else if (profile) {
            // Cache the role data
            if (profile.role) {
              localStorage.setItem(`userRole_${data.user.id}`, profile.role)
            }
            
            // Update user data with profile information
            setUserData(prev => ({
              ...prev,
              name: profile.name || prev.name,
              role: profile.role || prev.role
            }))
            setUserRole(profile.role || 'user')
          }
        }).catch(error => {
          console.error('Background profile fetch error:', error)
        })

        // Clear loading state after a longer delay for admin users to prevent flickering
        const loadingDelay = signInData.role === 'admin' ? 600 : 300
        setTimeout(() => {
          setIsLoading(false)
        }, loadingDelay)

        alert(`Welcome back! You are signed in as ${signInData.role || 'user'}.`)
      } else {
        console.error('No user data returned from sign in')
        setIsLoading(false)
        alert('Sign in failed: No user data returned')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(false)
      alert(`Sign in failed: ${error.message}`)
    }
  }

  const handleSignUp = async (signUpData) => {
    try {
      console.log('Attempting to sign up with:', { email: signUpData.email, name: signUpData.name })
      
      // Set loading state to prevent flickering
      setIsLoading(true)
      
      const { data, error } = await authService.signUp(
        signUpData.email,
        signUpData.password,
        signUpData.name,
        signUpData.phone,
        signUpData.role || 'user'
      )

      if (error) {
        console.error('Sign up error details:', error)
        setIsLoading(false)
        alert(`Sign up error: ${error.message}`)
        return
      }

      console.log('Sign up successful:', data)

      if (data.user) {
        // Prepare user data
        const newUserData = {
          id: data.user.id,
          name: signUpData.name,
          email: signUpData.email,
          phone: signUpData.phone,
          role: signUpData.role || 'user'
        }

        // Batch update all states to prevent intermediate renders
        const signUpBatch = () => {
          setIsAuthenticated(true)
          setUserRole(signUpData.role || 'user')
          setUserData(newUserData)
          
          if (signUpData.role === 'admin') {
            setCurrentPage('admin')
            navigateToPage('admin')
          } else {
            setCurrentPage('home')
            navigateToPage('home')
          }
        }

        // Execute batch update
        signUpBatch()

        // Clear loading state after a brief delay
        setTimeout(() => {
          setIsLoading(false)
        }, 300)

        alert(`Welcome ${signUpData.name}! Your account has been created successfully.`)
      } else {
        console.error('No user data returned from sign up')
        setIsLoading(false)
        alert('Sign up failed: No user data returned')
      }
    } catch (error) {
      console.error('Sign up error:', error)
      setIsLoading(false)
      alert(`Sign up failed: ${error.message}`)
    }
  }

  const handleSignOut = async () => {
    try {
      // Clear cached role data before signing out
      if (userData?.id) {
        localStorage.removeItem(`userRole_${userData.id}`)
      }
      
      const { error } = await authService.signOut()
      if (error) {
        console.error('Sign out error:', error)
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }

    setIsAuthenticated(false)
    setUserRole(null)
    setUserData(null)
    navigateToPage('landing')
    setIsLoading(false)
    alert('You have been signed out successfully.')
  }

  // Force admin state synchronously to prevent any intermediate renders
  useLayoutEffect(() => {
    if (isAuthenticated && userRole === 'admin' && currentPage !== 'admin') {
      console.log('useLayoutEffect: Forcing admin page')
      setCurrentPage('admin')
      navigateToPage('admin')
    }
  }, [isAuthenticated, userRole, currentPage])

  const renderPage = () => {
    // Show optimized loading screen during initial auth check, auth state changes, or role checking
    if (isLoading || !authInitialized || isRoleChecking) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="text-center">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-slate-200 rounded-full animate-spin border-t-slate-600 mx-auto"></div>
              <div className="absolute inset-0 w-12 h-12 border-4 border-transparent rounded-full animate-pulse border-t-slate-400 mx-auto"></div>
            </div>
            <div className="mt-4">
              <div className="inline-block animate-pulse">
                <span className="text-slate-600 font-medium">Loading</span>
                <span className="text-slate-400 animate-bounce inline-block ml-1">.</span>
                <span className="text-slate-400 animate-bounce inline-block ml-1" style={{animationDelay: '0.1s'}}>.</span>
                <span className="text-slate-400 animate-bounce inline-block ml-1" style={{animationDelay: '0.2s'}}>.</span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Show landing page immediately if not authenticated
    if (!isAuthenticated) {
      // If trying to access protected routes while not authenticated, redirect to landing
      const currentURLPage = getCurrentPageFromURL()
      if (currentURLPage !== 'landing' && currentURLPage !== 'home') {
        navigateToPage('landing')
      }
      return <LandingPage onSignIn={handleSignIn} onSignUp={handleSignUp} onSignOut={handleSignOut} />
    }

    // CRITICAL: Handle admin users first to prevent any flickering
    if (userRole === 'admin') {
      // Ensure admin page is set if it isn't already
      if (currentPage !== 'admin') {
        setCurrentPage('admin')
        navigateToPage('admin')
      }
      // Always return admin dashboard for admin users - no exceptions
      return <AdminDashboard onSignOut={handleSignOut} />
    }

    // Handle admin routes - only admins can access admin pages (redundant safety check)
    if (currentPage === 'admin' && userRole !== 'admin') {
      navigateToPage('home')
      return <Home userData={userData} />
    }

    // Regular user navigation - only accessible by non-admin users
    switch (currentPage) {
      case 'home':
        return <Home userData={userData} />
      case 'about':
        return <AboutUs />
      case 'contact':
        return <ContactUs />
      case 'tracking':
        return <ParcelTracking />
      case 'faq':
        return <FAQ userData={userData} />
      case 'admin':
        // This should never be reached for non-admin users
        navigateToPage('home')
        return <Home userData={userData} />
      case 'landing':
        return <LandingPage onSignIn={handleSignIn} onSignUp={handleSignUp} onSignOut={handleSignOut} />
      default:
        return <Home userData={userData} />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {isAuthenticated && userRole !== 'admin' && (
        <Navbar currentPage={currentPage} setCurrentPage={navigateToPage} onSignOut={handleSignOut} />
      )}
      <main className={isAuthenticated && userRole !== 'admin' ? 'pt-16' : ''}>
        {renderPage()}
      </main>
    </div>
  )
}

export default App
