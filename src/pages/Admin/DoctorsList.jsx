import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { Link } from 'react-router-dom'
import { FaEdit, FaArchive, FaCheck, FaTimes } from 'react-icons/fa'
import Modal from 'react-modal'

// Set the app element for accessibility
Modal.setAppElement('#root')

const DoctorsList = () => {
  const { doctors, changeAvailability, aToken, getAllDoctors, archiveDoctor } = useContext(AdminContext)
  const [archiveModalOpen, setArchiveModalOpen] = useState(false)
  const [doctorToArchive, setDoctorToArchive] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isArchiving, setIsArchiving] = useState(false)

  useEffect(() => {
    if (aToken) {
      getAllDoctors()
    }
  }, [aToken, getAllDoctors])

  const handleArchiveClick = (doctor) => {
    setDoctorToArchive(doctor)
    setArchiveModalOpen(true)
  }

  const confirmArchive = async () => {
    if (!doctorToArchive) return
    
    setIsArchiving(true)
    try {
      const success = await archiveDoctor(doctorToArchive._id)
      if (success) {
        setArchiveModalOpen(false)
        setDoctorToArchive(null)
        // Refresh the doctors list
        getAllDoctors()
      }
    } catch (error) {
      console.error('Error archiving doctor:', error)
    } finally {
      setIsArchiving(false)
    }
  }

  const cancelArchive = () => {
    setArchiveModalOpen(false)
    setDoctorToArchive(null)
  }

  const filteredDoctors = doctors.filter(doctor => 
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.speciality.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doctor.name_extension && doctor.name_extension.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className='m-5 max-h-[90vh] overflow-y-auto'>
      <div className="flex justify-between items-center mb-5">
        <h1 className='text-xl font-medium'>All Doctors</h1>
        <Link 
          to="/add-doctor" 
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md"
        >
          Add New Doctor
        </Link>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or speciality..."
          className="w-full md:w-1/3 px-4 py-2 border rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

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
                  Available
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => changeAvailability(doctor._id)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          doctor.available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {doctor.available ? (
                          <>
                            <FaCheck className="mr-1" />
                            Available
                          </>
                        ) : (
                          <>
                            <FaTimes className="mr-1" />
                            Unavailable
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/edit-doctor/${doctor._id}`}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-100 p-2 rounded-full"
                        >
                          <FaEdit />
                        </Link>
                        <button
                          onClick={() => handleArchiveClick(doctor)}
                          className="text-amber-600 hover:text-amber-900 bg-amber-100 p-2 rounded-full"
                          title="Archive Doctor"
                        >
                          <FaArchive />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? "No doctors match your search" : "No doctors found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Archive Confirmation Modal */}
      <Modal
        isOpen={archiveModalOpen}
        onRequestClose={cancelArchive}
        contentLabel="Archive Doctor Confirmation"
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
        <h2 className="text-xl font-bold mb-4">Confirm Archive</h2>
        <p className="mb-6">
          Are you sure you want to archive Dr. {doctorToArchive?.name}? The doctor will be moved to the archive.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={cancelArchive}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            disabled={isArchiving}
          >
            Cancel
          </button>
          <button
            onClick={confirmArchive}
            className="px-4 py-2 bg-amber-600 rounded-md text-white hover:bg-amber-700"
            disabled={isArchiving}
          >
            {isArchiving ? 'Archiving...' : 'Archive'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default DoctorsList