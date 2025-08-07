import { useState, useEffect } from 'react'
import { authService } from '../services/supabaseService'

const Profile = ({ userData, onBack }) => {
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    role: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (userData) {
      setProfileData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        role: userData.role || 'user'
      })
    }
  }, [userData])

  const handleSave = async () => {
    setIsLoading(true)
    setMessage('')
    
    try {
      const { data, error } = await authService.updateUserProfile(userData.id, {
        name: profileData.name,
        phone: profileData.phone
      })
      
      if (error) {
        setMessage('Error updating profile: ' + error.message)
      } else {
        setMessage('Profile updated successfully!')
        setIsEditing(false)
        // Update the userData in parent component
        if (data) {
          // You might want to update the parent component's userData here
        }
      }
    } catch (error) {
      setMessage('Error updating profile: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setProfileData({
      name: userData.name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      role: userData.role || 'user'
    })
    setIsEditing(false)
    setMessage('')
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-md ${
            message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            ) : (
              <p className="text-gray-900 py-2">{profileData.name || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <p className="text-gray-900 py-2">{profileData.email}</p>
            <p className="text-xs text-gray-500">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+254 712 345 678"
              />
            ) : (
              <p className="text-gray-900 py-2">{profileData.phone || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              profileData.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {profileData.role}
            </span>
            <p className="text-xs text-gray-500 mt-1">Role cannot be changed</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile 