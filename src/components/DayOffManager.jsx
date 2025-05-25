import React, { useState, useContext, useEffect, useRef } from 'react';
import { AdminContext } from '../context/AdminContext';
import { toast } from 'react-toastify';
import { FaCheck, FaTimes, FaSync, FaCalendarAlt, FaInfoCircle } from 'react-icons/fa';

const DayOffManager = () => {
  const { doctors, runDayOffChecker, getAllDoctors } = useContext(AdminContext);
  const [isLoading, setIsLoading] = useState(false);
  const [dayOffData, setDayOffData] = useState(null);
  const [currentDay, setCurrentDay] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [stats, setStats] = useState(null);
  const autoUpdateIntervalRef = useRef(null);

  // Get the current day of the week and set up auto-update
  useEffect(() => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    setCurrentDay(daysOfWeek[today.getDay()]);
    
    // Initial check when component mounts
    handleRunDayOffChecker();
    
    // Set up automatic checking every minute
    autoUpdateIntervalRef.current = setInterval(() => {
      console.log('Auto-checking day off status...');
      handleRunDayOffChecker(false); // silent update (no loading indicator)
    }, 60 * 1000); // Check every minute
    
    return () => {
      // Clean up interval when component unmounts
      if (autoUpdateIntervalRef.current) {
        clearInterval(autoUpdateIntervalRef.current);
      }
    };
  }, []);

  const handleRunDayOffChecker = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    
    try {
      const data = await runDayOffChecker();
      if (data) {
        setDayOffData(data);
        setLastUpdated(new Date());
        setStats(data.stats || null);
        // Refresh the doctors list to show updated availability
        await getAllDoctors();
      }
    } catch (error) {
      console.error('Error running day off checker:', error);
      if (showLoading) {
        toast.error('Failed to update doctor availability');
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Day Off Management</h2>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()} 
              <span className="inline-block ml-2 w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Real-time updates active"></span>
              <span className="text-xs text-green-600 ml-1">Auto-updating</span>
            </p>
          )}
        </div>
        <button
          onClick={() => handleRunDayOffChecker(true)}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          {isLoading ? (
            <>
              <FaSync className="animate-spin mr-2" /> Updating...
            </>
          ) : (
            <>
              <FaSync className="mr-2" /> Update Now
            </>
          )}
        </button>
      </div>

      <div className="mb-4 bg-blue-50 p-3 rounded-md border border-blue-100">
        <div className="flex items-center mb-2">
          <FaCalendarAlt className="text-blue-700 mr-2" />
          <p className="text-sm text-blue-800 font-semibold">
            Today is {currentDay}
          </p>
        </div>
        <p className="text-sm text-blue-700">
          Doctors with today as their day off will be automatically marked as unavailable.
          When their day off is over, they will be automatically marked as available again.
        </p>
        <p className="text-sm text-blue-700 mt-1">
          Status is automatically checked every minute. You can also click "Update Now" to manually refresh.
        </p>
      </div>
      
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-green-50 p-3 rounded-md border border-green-100">
            <p className="text-xs text-green-700 font-medium">Available Doctors</p>
            <p className="text-xl font-bold text-green-800">{stats.available} <span className="text-sm">/ {stats.total}</span></p>
          </div>
          <div className="bg-red-50 p-3 rounded-md border border-red-100">
            <p className="text-xs text-red-700 font-medium">Unavailable Doctors</p>
            <p className="text-xl font-bold text-red-800">{stats.unavailable} <span className="text-sm">/ {stats.total}</span></p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100">
            <p className="text-xs text-yellow-700 font-medium">On Day Off Today</p>
            <p className="text-xl font-bold text-yellow-800">{stats.onDayOff} <span className="text-sm">/ {stats.total}</span></p>
          </div>
          <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
            <p className="text-xs text-blue-700 font-medium">Status Changes</p>
            <p className="text-xl font-bold text-blue-800">
              <span className="text-green-700">+{stats.turnedOn || 0}</span> / 
              <span className="text-red-700">-{stats.turnedOff || 0}</span>
            </p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
              <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day Off</th>
              <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day Off Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {doctors.map((doctor) => (
              <tr key={doctor._id} className={`hover:bg-gray-50 ${doctor.dayOff === currentDay ? 'bg-yellow-50' : ''}`}>
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full overflow-hidden mr-3">
                      <img 
                        src={doctor.image} 
                        alt={doctor.name} 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/40';
                        }}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                      <div className="text-xs text-gray-500">{doctor.speciality}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className={`text-sm ${doctor.dayOff && doctor.dayOff !== 'None' ? 'text-gray-900 font-medium' : 'text-gray-500 italic'}`}>
                    {doctor.dayOff && doctor.dayOff !== 'None' ? doctor.dayOff : 'None'}
                  </span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {doctor.available ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      <FaCheck className="mr-1 mt-0.5" /> Available
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      <FaTimes className="mr-1 mt-0.5" /> Unavailable
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {doctor.dayOff === currentDay ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      <FaInfoCircle className="mr-1 mt-0.5" /> On Day Off Today
                    </span>
                  ) : doctor.dayOff && doctor.dayOff !== 'None' ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      <FaCalendarAlt className="mr-1 mt-0.5" /> Day Off: {doctor.dayOff}
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      No Day Off Set
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DayOffManager;
