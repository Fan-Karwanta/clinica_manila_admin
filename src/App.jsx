import React, { useContext } from 'react'
import { DoctorContext } from './context/DoctorContext';
import { AdminContext } from './context/AdminContext';
import { Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Admin/Dashboard';
import AllAppointments from './pages/Admin/AllAppointments';
import AddDoctor from './pages/Admin/AddDoctor';
import EditDoctor from './pages/Admin/EditDoctor';
import DoctorsList from './pages/Admin/DoctorsList';
import Login from './pages/Login';
import DoctorAppointments from './pages/Doctor/DoctorAppointments';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorProfile from './pages/Doctor/DoctorProfile';
import DoctorAnalytics from './pages/Doctor/DoctorAnalytics';
import DoctorAppointmentHistory from './pages/Doctor/DoctorAppointmentHistory';
import PendingRegistrations from './pages/Admin/PendingRegistrations';
import AdminAnalytics from './pages/Admin/AdminAnalytics';
import UsersList from './pages/Admin/UsersList';
import Archive from './pages/Admin/Archive';
import DayOffManagement from './pages/Admin/DayOffManagement';

const App = () => {

  const { dToken } = useContext(DoctorContext)
  const { aToken } = useContext(AdminContext)

  return dToken || aToken ? (
    <div className='bg-[#F8F9FD]'>
      <ToastContainer />
      <Navbar />
      <div className='flex items-start'>
        <Sidebar />
        <Routes>
          <Route path='/' element={<Dashboard />} />
          <Route path='/admin-dashboard' element={<Dashboard />} />
          <Route path='/all-appointments' element={<AllAppointments />} />
          <Route path='/add-doctor' element={<AddDoctor />} />
          <Route path='/edit-doctor/:id' element={<EditDoctor />} />
          <Route path='/doctor-list' element={<DoctorsList />} />
          <Route path='/doctor-dashboard' element={<DoctorDashboard />} />
          <Route path='/doctor-appointments' element={<DoctorAppointments />} />
          <Route path='/doctor-appointment-history' element={<DoctorAppointmentHistory />} />
          <Route path='/doctor-profile' element={<DoctorProfile />} />
          <Route path='/doctor-analytics' element={<DoctorAnalytics />} />
          <Route path='/pending-registrations' element={<PendingRegistrations />} />
          <Route path='/admin-analytics' element={<AdminAnalytics />} />
          <Route path='/users-list' element={<UsersList />} />
          <Route path='/archive' element={<Archive />} />
          <Route path='/day-off-management' element={<DayOffManagement />} />
        </Routes>
      </div>
    </div>
  ) : (
    <>
      <ToastContainer />
      <Login />
    </>
  )
}

export default App