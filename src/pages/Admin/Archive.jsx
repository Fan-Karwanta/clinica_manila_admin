import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { FaUndo } from 'react-icons/fa'
import Modal from 'react-modal'

// Set the app element for accessibility
Modal.setAppElement('#root')

const Archive = () => {
  const { 
    archivedDoctors, 
    archivedUsers, 
    getArchivedDoctors, 
    getArchivedUsers, 
    restoreDoctor, 
    restoreUser, 
    aToken 
  } = useContext(AdminContext)
  
  const [activeTab, setActiveTab] = useState('doctors')
  const [restoreModalOpen, setRestoreModalOpen] = useState(false)
  const [itemToRestore, setItemToRestore] = useState(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (aToken) {
      getArchivedDoctors()
      getArchivedUsers()
    }
  }, [aToken, getArchivedDoctors, getArchivedUsers])

  const handleRestoreClick = (item, type) => {
    setItemToRestore({ item, type })
    setRestoreModalOpen(true)
  }

  const confirmRestore = async () => {
    if (!itemToRestore) return
    
    setIsRestoring(true)
    try {
      let success
      if (itemToRestore.type === 'doctor') {
        success = await restoreDoctor(itemToRestore.item._id)
      } else {
        success = await restoreUser(itemToRestore.item._id)
      }
      
      if (success) {
        setRestoreModalOpen(false)
        setItemToRestore(null)
        // Refresh the lists after restoring
        getArchivedDoctors()
        getArchivedUsers()
      }
    } catch (error) {
      console.error('Error restoring item:', error)
    } finally {
      setIsRestoring(false)
    }
  }

  const cancelRestore = () => {
    setRestoreModalOpen(false)
    setItemToRestore(null)
  }

  // Filter archived doctors based on search term
  const filteredDoctors = archivedDoctors.filter(doctor => 
    doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.speciality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doctor.name_extension && doctor.name_extension.toLowerCase().includes(searchTerm.toLowerCase())) ||
    doctor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filter archived users based on search term
  const filteredUsers = archivedUsers.filter(user => 
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className='m-5 max-h-[90vh] overflow-y-auto'>
      <h1 className='text-xl font-medium mb-5'>Archive</h1>
      
      {/* Tabs */}
      <div className="flex border-b mb-5">
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'doctors' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
          onClick={() => setActiveTab('doctors')}
        >
          Archived Doctors
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'patients' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
          onClick={() => setActiveTab('patients')}
        >
          Archived Patients
        </button>
      </div>

      {/* Search Box */}
      <div className="mb-4">
        <input
          type="text"
          placeholder={`Search archived ${activeTab === 'doctors' ? 'doctors' : 'patients'}...`}
          className="w-full md:w-1/3 px-4 py-2 border rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Doctors Tab Content */}
      {activeTab === 'doctors' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Speciality
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Experience
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    License ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Archived Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDoctors.length > 0 ? (
                  filteredDoctors.map((doctor) => (
                    <tr key={doctor._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full object-cover" src={doctor.image} alt="" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              Dr. {doctor.name} {doctor.name_extension && <span className="text-gray-500">{doctor.name_extension}</span>}
                            </div>
                            <div className="text-sm text-gray-500">{doctor.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {doctor.speciality === 'Internal_Medicine' ? 'Internal Medicine' : doctor.speciality}
                        </div>
                        <div className="text-sm text-gray-500">{doctor.degree}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doctor.experience}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doctor.doc_lic_ID || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doctor.archivedAt ? new Date(doctor.archivedAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRestoreClick(doctor, 'doctor')}
                            className="text-blue-600 hover:text-blue-900 bg-blue-100 p-2 rounded-full"
                            title="Restore Doctor"
                          >
                            <FaUndo />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      {searchTerm ? "No archived doctors match your search" : "No archived doctors found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Patients Tab Content */}
      {activeTab === 'patients' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Archived Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full object-cover" src={user.image || 'https://via.placeholder.com/150'} alt="" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.phone || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.archivedAt ? new Date(user.archivedAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRestoreClick(user, 'user')}
                            className="text-blue-600 hover:text-blue-900 bg-blue-100 p-2 rounded-full"
                            title="Restore Patient"
                          >
                            <FaUndo />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                      {searchTerm ? "No archived patients match your search" : "No archived patients found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={restoreModalOpen}
        onRequestClose={cancelRestore}
        contentLabel="Restore Confirmation"
        className="max-w-md mx-auto mt-40 bg-white rounded-lg shadow-lg p-6"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20"
        style={{
          overlay: {
            zIndex: 1000
          },
          content: {
            maxHeight: '200px'
          }
        }}
      >
        <h2 className="text-xl font-bold mb-4">Confirm Restore</h2>
        <p className="mb-6">
          {itemToRestore?.type === 'doctor' 
            ? `Are you sure you want to restore Dr. ${itemToRestore?.item?.name}?` 
            : `Are you sure you want to restore ${itemToRestore?.item?.firstName} ${itemToRestore?.item?.lastName}?`}
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={cancelRestore}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            disabled={isRestoring}
          >
            Cancel
          </button>
          <button
            onClick={confirmRestore}
            className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700"
            disabled={isRestoring}
          >
            {isRestoring ? 'Restoring...' : 'Restore'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default Archive
