import axios from 'axios'
import React, { useContext, useState } from 'react'
import { DoctorContext } from '../context/DoctorContext'
import { AdminContext } from '../context/AdminContext'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'

const Login = () => {

  const [state, setState] = useState('Admin')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const backendUrl = import.meta.env.VITE_BACKEND_URL

  const { setDToken } = useContext(DoctorContext)
  const { setAToken } = useContext(AdminContext)
  const navigate = useNavigate()

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (state === 'Admin') {

      const { data } = await axios.post(backendUrl + '/api/admin/login', { email, password })
      if (data.success) {
        setAToken(data.token)
        localStorage.setItem('aToken', data.token)
      } else {
        toast.error(data.message)
      }

    } else {

      const { data } = await axios.post(backendUrl + '/api/doctor/login', { email, password })
      if (data.success) {
        setDToken(data.token)
        localStorage.setItem('dToken', data.token)
        toast.success('Doctor login successful!')
        navigate('/doctor-dashboard')
      } else {
        toast.error(data.message)
      }

    }

  }

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
        {/* Clinic Logo - Fixed at the top regardless of login type */}
        <div className="flex justify-center w-full mb-4">
          <img 
            src={assets.admin_logo} 
            alt="Clinica Manila Logo" 
            className="h-20 object-contain"
          />
        </div>
        
        <div className="flex flex-col items-center w-full mb-2">
          <img 
            src={state === 'Admin' ? assets.admin_icon : assets.doctor_icon} 
            alt={`${state} Icon`}
            className="w-16 h-16 mb-2" 
          />
          <p className='text-2xl font-semibold'>
            <span className='text-primary'>{state}</span> Login
          </p>
        </div>
        
        <div className='w-full '>
          <p>Email</p>
          <input onChange={(e) => setEmail(e.target.value)} value={email} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="email" required />
        </div>
        <div className='w-full '>
          <p>Password</p>
          <input 
            onChange={(e) => setPassword(e.target.value)} 
            value={password} 
            className='border border-[#DADADA] rounded w-full p-2 mt-1' 
            type={showPassword ? "text" : "password"} 
            required 
          />
          <div className="flex items-center mt-2">
            <input 
              type="checkbox" 
              id="showPassword" 
              checked={showPassword} 
              onChange={() => setShowPassword(!showPassword)} 
              className="mr-2"
            />
            <label htmlFor="showPassword" className="text-sm cursor-pointer">Show Password</label>
          </div>
        </div>
        <button className='bg-primary text-white w-full py-2 rounded-md text-base'>Login</button>
        
        <button 
          type="button"
          onClick={() => setState(state === 'Admin' ? 'Doctor' : 'Admin')} 
          className='bg-primary text-white w-full py-2 rounded-md text-base mt-2 flex items-center justify-center gap-2'
        >
          <img 
            src={state === 'Admin' ? assets.steth : assets.admin_icon} 
            alt={state === 'Admin' ? 'Doctor Icon' : 'Admin Icon'} 
            className="w-5 h-5 filter brightness-0 invert" 
          />
          {state === 'Admin' ? 'Doctor Login' : 'Admin Login'}
        </button>
      </div>
    </form>
  )
}

export default Login