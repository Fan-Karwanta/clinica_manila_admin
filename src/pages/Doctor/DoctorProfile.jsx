import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'
import axios from 'axios'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

const DoctorProfile = () => {
    const { dToken, profileData, setProfileData, getProfileData } = useContext(DoctorContext)
    const { currency, backendUrl } = useContext(AppContext)
    const [isEdit, setIsEdit] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordsMatch, setPasswordsMatch] = useState(true)
    const [showPassword, setShowPassword] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)

    const updateProfile = async () => {
        try {
            setLoading(true)
            const updateData = {
                address: profileData.address,
                fees: profileData.fees,
                about: profileData.about,
                available: profileData.available,
                dayOff: profileData.dayOff
            }

            const { data } = await axios.post(backendUrl + '/api/doctor/update-profile', updateData, { headers: { dToken } })

            if (data.success) {
                toast.success(data.message)
                setIsEdit(false)
                getProfileData()
                
                // Manually trigger the day off checker to update availability status in real-time
                try {
                    await axios.get(backendUrl + '/api/doctor/update-day-off-availability', { headers: { dToken } })
                    console.log('Day off availability updated after profile change')
                } catch (dayOffError) {
                    console.error('Error updating day off availability:', dayOffError)
                    // Continue even if day off check fails
                }
            } else {
                toast.error(data.message)
            }

            setIsEdit(false)
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    const changePassword = async () => {
        try {
            if (newPassword !== confirmPassword) {
                setPasswordsMatch(false)
                return
            }

            setPasswordLoading(true)
            const { data } = await axios.post(
                backendUrl + '/api/doctor/change-password', 
                { currentPassword, newPassword }, 
                { headers: { dToken } }
            )

            if (data.success) {
                toast.success(data.message)
                setShowPasswordModal(false)
                resetPasswordFields()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
            console.log(error)
        } finally {
            setPasswordLoading(false)
        }
    }

    const resetPasswordFields = () => {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setPasswordsMatch(true)
        setShowPassword(false)
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword)
    }

    useEffect(() => {
        if (dToken) {
            getProfileData()
        }
    }, [dToken])

    // Check if passwords match whenever either password field changes
    useEffect(() => {
        if (newPassword === '' && confirmPassword === '') {
            setPasswordsMatch(true);
        } else if (newPassword !== '' && confirmPassword !== '') {
            setPasswordsMatch(newPassword === confirmPassword);
        }
    }, [newPassword, confirmPassword]);

    const cancelEdit = () => {
        getProfileData() // Reset to original data
        setIsEdit(false)
    }

    return profileData && (
        <div className="bg-gray-50 min-h-screen p-4 md:p-6">
            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Change Password</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg pr-10"
                                        placeholder="Enter current password"
                                        required
                                    />
                                    <button 
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className={`w-full p-2 border rounded-lg pr-10 ${!passwordsMatch && newPassword && confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Enter new password"
                                        required
                                    />
                                    <button 
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`w-full p-2 border rounded-lg pr-10 ${!passwordsMatch && newPassword && confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Confirm new password"
                                        required
                                    />
                                    <button 
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                {!passwordsMatch && newPassword && confirmPassword && (
                                    <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 mt-6">
                            <button 
                                onClick={() => {
                                    setShowPasswordModal(false)
                                    resetPasswordFields()
                                }}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                                disabled={passwordLoading}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={changePassword}
                                className={`px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-all ${(!passwordsMatch || !currentPassword || !newPassword || !confirmPassword) ? 'opacity-70 cursor-not-allowed' : ''}`}
                                disabled={passwordLoading || !passwordsMatch || !currentPassword || !newPassword || !confirmPassword}
                            >
                                {passwordLoading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="max-w-5xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Doctor Profile</h1>
                
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Header Section with Banner & Profile Photo */}
                    <div className="relative h-48 bg-gradient-to-r from-primary/80 to-blue-500/80">
                        <div className="absolute -bottom-16 left-8 sm:left-10">
                            <div className="relative">
                                <img 
                                    className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-md" 
                                    src={profileData.image} 
                                    alt={`Dr. ${profileData.name}`}
                                />
                                <div className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white ${profileData.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="pt-20 px-4 sm:px-8 pb-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-2xl font-bold text-gray-800">
                                        Dr. {profileData.name} 
                                        {profileData.name_extension && <span className="text-lg font-medium text-gray-600">, {profileData.name_extension}</span>}
                                    </h2>
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${profileData.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {profileData.available ? 'Available' : 'Unavailable'}
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center flex-wrap gap-2">
                                    <div className="text-gray-700 font-medium">{profileData.speciality}</div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 hidden sm:block"></div>
                                    <div className="text-gray-600">{profileData.degree}</div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 hidden sm:block"></div>
                                    <div className="text-sm px-2 py-0.5 bg-gray-100 rounded-full text-gray-700">{profileData.experience}</div>
                                </div>
                            </div>
                            <div className="self-start mt-2 sm:mt-0">
                                {isEdit ? (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={cancelEdit}
                                            className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                                            disabled={loading}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={updateProfile}
                                            className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2"
                                            disabled={loading}
                                        >
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setIsEdit(true)}
                                        className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Main content area with improved layout */}
                        <div className="mt-8">
                            {/* About Section */}
                            <div className="mb-6">
                                <h3 className="text-lg font-medium text-gray-800 mb-3">About</h3>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    {isEdit ? (
                                        <textarea 
                                            onChange={(e) => setProfileData(prev => ({ ...prev, about: e.target.value }))} 
                                            className="w-full outline-primary border border-gray-300 rounded-lg p-3 min-h-[120px]" 
                                            value={profileData.about} 
                                        />
                                    ) : (
                                        <p className="text-gray-700 whitespace-pre-wrap">{profileData.about}</p>
                                    )}
                                </div>
                            </div>
                            
                            {/* Two-column layout for the rest of the content */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div>
                                    {/* Qualifications */}
                                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                        <h3 className="text-lg font-medium text-gray-800 mb-3">Qualifications</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Degree</p>
                                                <p className="font-medium text-gray-700">{profileData.degree}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Speciality</p>
                                                <p className="font-medium text-gray-700">{profileData.speciality}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Experience</p>
                                                <p className="font-medium text-gray-700">{profileData.experience}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">License ID</p>
                                                <p className="font-medium text-gray-700">{profileData.doc_lic_ID}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-lg font-medium text-gray-800 mb-3">Contact Information</h3>
                                        
                                        <div className="mb-4">
                                            <p className="text-sm text-gray-500">Email Address</p>
                                            <p className="font-medium text-gray-700">{profileData.email}</p>
                                        </div>
                                        
                                        <div>
                                            <p className="text-sm text-gray-500">Address</p>
                                            {isEdit ? (
                                                <div className="space-y-2 mt-1">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Address Line 1"
                                                        className="w-full p-2 border border-gray-300 rounded"
                                                        value={profileData.address.line1} 
                                                        onChange={(e) => setProfileData(prev => ({ 
                                                            ...prev, 
                                                            address: { ...prev.address, line1: e.target.value }
                                                        }))}
                                                    />
                                                    <input 
                                                        type="text"
                                                        placeholder="Address Line 2"
                                                        className="w-full p-2 border border-gray-300 rounded"
                                                        value={profileData.address.line2}
                                                        onChange={(e) => setProfileData(prev => ({ 
                                                            ...prev, 
                                                            address: { ...prev.address, line2: e.target.value }
                                                        }))}
                                                    />
                                                </div>
                                            ) : (
                                                <address className="not-italic text-gray-700">
                                                    {profileData.address.line1}<br />
                                                    {profileData.address.line2}
                                                </address>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Settings */}
                                <div>
                                    {/* Availability Settings */}
                                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                        <h3 className="text-lg font-medium text-gray-800 mb-3">Availability Settings</h3>
                                        
                                        {/* Available toggle */}
                                        <div className="mb-4">
                                            <div className="flex items-center">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer"
                                                        checked={profileData.available}
                                                        onChange={() => isEdit && setProfileData(prev => ({ 
                                                            ...prev, 
                                                            available: !prev.available 
                                                        }))}
                                                        disabled={!isEdit}
                                                    />
                                                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer ${profileData.available ? 'peer-checked:bg-primary' : ''} after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full`}></div>
                                                    <span className="ml-3 text-gray-700 text-sm font-medium">
                                                        {profileData.available ? 'Available for Appointments' : 'Not Available'}
                                                    </span>
                                                </label>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Toggle this setting to control your availability for new appointments.
                                            </p>
                                        </div>
                                        
                                        {/* Day Off Feature */}
                                        <div className="border-t border-gray-200 pt-4">
                                            <h4 className="text-sm font-medium text-gray-800 mb-2">Day Off</h4>
                                            <div className="relative">
                                                <select
                                                    className={`w-full p-2 border ${isEdit ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50'} rounded-lg`}
                                                    value={profileData.dayOff || ''}
                                                    onChange={(e) => isEdit && setProfileData(prev => ({
                                                        ...prev,
                                                        dayOff: e.target.value
                                                    }))}
                                                    disabled={!isEdit}
                                                >
                                                    <option value="">No Day Off Selected</option>
                                                    <option value="Monday">Monday</option>
                                                    <option value="Tuesday">Tuesday</option>
                                                    <option value="Wednesday">Wednesday</option>
                                                    <option value="Thursday">Thursday</option>
                                                    <option value="Friday">Friday</option>
                                                    <option value="Saturday">Saturday</option>
                                                    <option value="Sunday">Sunday</option>
                                                </select>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Select your regular day off. You will be automatically marked as unavailable on this day every week.
                                            </p>
                                            {profileData.dayOff && (
                                                <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                                                    <p className="text-sm text-blue-700">
                                                        <span className="font-medium">Day Off:</span> {profileData.dayOff}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Security Settings */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-lg font-medium text-gray-800 mb-3">Security Settings</h3>
                                        <button 
                                            onClick={() => setShowPasswordModal(true)}
                                            className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                                        >
                                            Change Password
                                        </button>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Update your password regularly to maintain account security.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DoctorProfile