import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  BookOpen,
  Settings,
  Bell,
  Shield,
  Download,
  Upload,
  Edit3,
  Save,
  X,
  ArrowLeft
} from 'lucide-react'

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    email: 'john.doe@university.edu',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    university: 'Tech University',
    major: 'Computer Science',
    year: 'Senior',
    joinedDate: '2023-09-01'
  })

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    autoSaveNotes: true,
    shareAnalytics: false
  })

  const handleSave = () => {
    setIsEditing(false)
    // Save profile data
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset changes
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link 
            to="/" 
            className="text-secondary-500 hover:text-secondary-700 transition-colors duration-200"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Profile Settings
            </h1>
            <p className="text-secondary-600">
              Manage your account information and preferences
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="card text-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-12 h-12 text-white" />
              </div>
              <button className="absolute bottom-0 right-1/2 transform translate-x-1/2 translate-y-2 bg-white border-2 border-secondary-200 rounded-full p-2 hover:bg-secondary-50 transition-colors duration-200">
                <Upload className="w-4 h-4 text-secondary-600" />
              </button>
            </div>
            
            <h2 className="text-xl font-semibold text-secondary-900 mb-1">
              {profileData.name}
            </h2>
            <p className="text-secondary-600 mb-4">{profileData.major}</p>
            
            <div className="space-y-2 text-sm text-secondary-600">
              <div className="flex items-center justify-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>{profileData.university}</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(profileData.joinedDate).getFullYear()}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-secondary-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-secondary-900">5</div>
                  <div className="text-xs text-secondary-600">Subjects</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-secondary-900">23</div>
                  <div className="text-xs text-secondary-600">Lectures</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-secondary-900">32h</div>
                  <div className="text-xs text-secondary-600">Study Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary-900">Personal Information</h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSave}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="input"
                  />
                ) : (
                  <div className="flex items-center space-x-2 text-secondary-900">
                    <User className="w-4 h-4 text-secondary-500" />
                    <span>{profileData.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="input"
                  />
                ) : (
                  <div className="flex items-center space-x-2 text-secondary-900">
                    <Mail className="w-4 h-4 text-secondary-500" />
                    <span>{profileData.email}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className="input"
                  />
                ) : (
                  <div className="flex items-center space-x-2 text-secondary-900">
                    <Phone className="w-4 h-4 text-secondary-500" />
                    <span>{profileData.phone}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                    className="input"
                  />
                ) : (
                  <div className="flex items-center space-x-2 text-secondary-900">
                    <MapPin className="w-4 h-4 text-secondary-500" />
                    <span>{profileData.location}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  University
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.university}
                    onChange={(e) => setProfileData({...profileData, university: e.target.value})}
                    className="input"
                  />
                ) : (
                  <div className="flex items-center space-x-2 text-secondary-900">
                    <BookOpen className="w-4 h-4 text-secondary-500" />
                    <span>{profileData.university}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Major
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.major}
                    onChange={(e) => setProfileData({...profileData, major: e.target.value})}
                    className="input"
                  />
                ) : (
                  <div className="flex items-center space-x-2 text-secondary-900">
                    <BookOpen className="w-4 h-4 text-secondary-500" />
                    <span>{profileData.major}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-6">Preferences</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-secondary-500" />
                  <div>
                    <p className="font-medium text-secondary-900">Email Notifications</p>
                    <p className="text-sm text-secondary-600">Receive updates about your lectures and notes</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-secondary-500" />
                  <div>
                    <p className="font-medium text-secondary-900">Auto-save Notes</p>
                    <p className="text-sm text-secondary-600">Automatically save notes during lectures</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoSaveNotes}
                    onChange={(e) => setSettings({...settings, autoSaveNotes: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-secondary-500" />
                  <div>
                    <p className="font-medium text-secondary-900">Share Analytics</p>
                    <p className="text-sm text-secondary-600">Help improve LectureWeave with usage data</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.shareAnalytics}
                    onChange={(e) => setSettings({...settings, shareAnalytics: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Data Export */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-6">Data & Privacy</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                <div>
                  <p className="font-medium text-secondary-900">Export Your Data</p>
                  <p className="text-sm text-secondary-600">Download all your notes and lecture data</p>
                </div>
                <button className="btn-secondary flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-red-900">Delete Account</p>
                  <p className="text-sm text-red-600">Permanently delete your account and all data</p>
                </div>
                <button className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
