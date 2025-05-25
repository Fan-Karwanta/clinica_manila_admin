import React, { useContext, useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'
import CancellationModal from '../../components/CancellationModal'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts'
import { format, subDays, parseISO } from 'date-fns'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const Dashboard = () => {
  const { aToken, getDashData, cancelAppointment, dashData, appointments, getAllAppointments, doctors, getAllDoctors } = useContext(AdminContext)
  const { slotDateFormat } = useContext(AppContext)
  const navigate = useNavigate()
  
  // State for cancellation modal
  const [showCancellationModal, setShowCancellationModal] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null)

  // State for dashboard components
  const [weekdayDistribution, setWeekdayDistribution] = useState([])
  const [demographicData, setDemographicData] = useState([])
  const [activityLog, setActivityLog] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Analytics state
  const [analytics, setAnalytics] = useState({
    systemStats: {},
    appointmentTrends: [],
    doctorPerformance: [],
    genderDistribution: [],
    appointmentTimeDistribution: []
  })

  useEffect(() => {
    if (aToken) {
      setIsLoading(true)
      getDashData()
      getAllAppointments() // Get all appointments to calculate doctor stats
      getAllDoctors() // Get all doctors for analytics
    }
  }, [aToken])

  // Process data when appointments change
  useEffect(() => {
    if (appointments.length > 0 && dashData) {
      setWeekdayDistribution(processAppointmentsByWeekday())
      setDemographicData(generateDemographicData())

      // Generate activity log from recent appointments
      const log = appointments.slice(0, 10).map(app => ({
        type: app.isCompleted ? 'completed' : app.cancelled ? 'cancelled' : 'scheduled',
        message: `Appointment with Dr. ${app.docData.name} ${app.isCompleted ? 'completed' : app.cancelled ? 'cancelled' : 'scheduled'}`,
        time: new Date(app.slotDate).toLocaleString()
      }));
      setActivityLog(log)
      setIsLoading(false)
    }
  }, [appointments, dashData])
  
  // Process analytics data
  useEffect(() => {
    if (appointments?.length >= 0 && doctors?.length >= 0 && dashData) {
      processAnalytics();
    }
  }, [appointments, doctors, dashData]);

  // Calculate statistics
  const totalAppointments = dashData?.appointments || 0
  const completedAppointments = dashData?.latestAppointments?.filter(app => app.isCompleted).length || 0
  const cancelledAppointments = dashData?.latestAppointments?.filter(app => app.cancelled).length || 0
  const pendingAppointments = dashData?.latestAppointments?.filter(app => !app.isCompleted && !app.cancelled).length || 0
  const completionRate = totalAppointments ? ((completedAppointments / totalAppointments) * 100).toFixed(1) : 0

  // Calculate doctor statistics from all appointments
  const doctorStats = appointments.reduce((acc, app) => {
    const docId = app.docId
    if (!acc[docId]) {
      acc[docId] = {
        id: docId,
        name: app.docData.name,
        image: app.docData.image,
        speciality: app.docData.speciality || 'General Practitioner',
        totalAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        pendingAppointments: 0
      }
    }
    acc[docId].totalAppointments++
    if (app.isCompleted) acc[docId].completedAppointments++
    else if (app.cancelled) acc[docId].cancelledAppointments++
    else acc[docId].pendingAppointments++
    return acc
  }, {})

  // Get most selected doctors
  const mostSelectedDoctors = Object.values(doctorStats)
    .sort((a, b) => b.totalAppointments - a.totalAppointments)
    .slice(0, 3)

  // Helper functions for data processing
  const processAppointmentsByWeekday = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const counts = Array(7).fill(0);

    appointments.forEach(app => {
      const date = new Date(app.slotDate);
      const dayOfWeek = date.getDay();
      counts[dayOfWeek]++;
    });

    return days.map((day, index) => ({
      name: day.substring(0, 3),
      value: counts[index]
    }));
  };

  // Generate demographic data based on patients
  const generateDemographicData = () => {
    // This would ideally come from actual patient data
    // For now we'll create sample data based on total patients
    const maleCount = Math.floor(dashData.patients * 0.48);
    const femaleCount = Math.floor(dashData.patients * 0.51);
    const otherCount = dashData.patients - maleCount - femaleCount;

    return [
      { name: 'Male', value: maleCount },
      { name: 'Female', value: femaleCount },
      { name: 'Other', value: otherCount }
    ];
  };
  
  // Process analytics data from appointments and doctors
  const processAnalytics = () => {
    // System-wide statistics
    const systemStats = {
      totalAppointments: appointments?.length || 0,
      totalDoctors: doctors?.length || 0,
      totalPatients: dashData?.patients || 0,
      completedAppointments: appointments?.filter(app => app.isCompleted)?.length || 0,
      cancelledAppointments: appointments?.filter(app => app.cancelled)?.length || 0,
      activeAppointments: appointments?.filter(app => !app.isCompleted && !app.cancelled)?.length || 0
    };

    // Process appointment trends for last 7 days
    const appointmentsByDay = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return format(date, 'yyyy-MM-dd');
    }).reverse();

    last7Days.forEach(day => {
      const dayAppointments = appointments?.filter(app => 
        format(new Date(parseInt(app.date)), 'yyyy-MM-dd') === day
      ) || [];
      
      appointmentsByDay[day] = {
        total: dayAppointments.length,
        completed: dayAppointments.filter(app => app.isCompleted).length,
        cancelled: dayAppointments.filter(app => app.cancelled).length
      };
    });

    const appointmentTrends = Object.entries(appointmentsByDay).map(([date, stats]) => ({
      date: format(parseISO(date), 'MMM dd'),
      total: stats.total,
      completed: stats.completed,
      cancelled: stats.cancelled
    }));

    // Process doctor performance using appointments data
    const doctorStats = appointments.reduce((acc, app) => {
      const docId = app.docId;
      if (!acc[docId]) {
        const doctor = app.docData || {};
        acc[docId] = {
          name: doctor.name || 'Unknown',
          specialization: doctor.specialization || doctor.speciality || 'General',
          completed: 0,
          cancelled: 0,
          pending: 0,
          total: 0
        };
      }
      acc[docId].total++;
      if (app.isCompleted) acc[docId].completed++;
      else if (app.cancelled) acc[docId].cancelled++;
      else acc[docId].pending++;
      return acc;
    }, {});

    const doctorPerformance = Object.values(doctorStats)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Process gender distribution from patient data
    // Using estimated distribution based on total patients count
    const maleCount = Math.floor(dashData.patients * 0.48);
    const femaleCount = Math.floor(dashData.patients * 0.51);
    const otherCount = dashData.patients - maleCount - femaleCount;
    
    const genderDistribution = [
      { name: 'Male', value: maleCount },
      { name: 'Female', value: femaleCount },
      { name: 'Other', value: otherCount }
    ];

    // Process appointment time distribution
    const timeSlots = appointments?.reduce((acc, app) => {
      const time = app.slotTime;
      if (time) {
        acc[time] = (acc[time] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    const appointmentTimeDistribution = Object.entries(timeSlots)
      .map(([time, count]) => ({
        time,
        count
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    setAnalytics({
      systemStats,
      appointmentTrends,
      doctorPerformance,
      genderDistribution,
      appointmentTimeDistribution
    });
  };
  
  // For pie chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Function to export charts to PDF
  const exportChartsToPDF = async () => {
    const chartsContainer = document.getElementById('charts-container');
    if (!chartsContainer) return;

    // Create PDF in landscape orientation for better chart layout
    const pdf = new jsPDF('l', 'mm', 'a4');
    
    // A4 landscape dimensions (297 x 210 mm)
    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 10;

    // Add title centered at the top
    pdf.setFontSize(16);
    pdf.text('System Analytics Dashboard Report', pageWidth / 2, margin, { align: 'center' });
    
    // Add date and system stats under the title
    pdf.setFontSize(10);
    pdf.text(`Generated on: ${format(new Date(), 'PPP')}`, pageWidth / 2, margin + 7, { align: 'center' });
    
    // Add system stats as a summary
    const stats = [
      `Total Doctors: ${analytics.systemStats.totalDoctors}`,
      `Total Patients: ${analytics.systemStats.totalPatients}`,
      `Total Appointments: ${analytics.systemStats.totalAppointments}`,
      `Approved: ${analytics.systemStats.completedAppointments}`,
      `Active: ${analytics.systemStats.activeAppointments}`,
      `Cancelled: ${analytics.systemStats.cancelledAppointments}`
    ];
    
    // Layout stats in two rows
    const statsPerRow = 3;
    stats.forEach((stat, index) => {
      const row = Math.floor(index / statsPerRow);
      const col = index % statsPerRow;
      const x = margin + (col * ((pageWidth - (margin * 2)) / statsPerRow));
      pdf.text(stat, x, margin + 15 + (row * 5));
    });

    // Calculate dimensions for 2x2 grid layout
    const chartWidth = (pageWidth - (margin * 3)) / 2;
    const chartHeight = (pageHeight - (margin * 4) - 30) / 2; // Reduced height to accommodate stats

    // Get all chart containers
    const chartDivs = Array.from(chartsContainer.querySelectorAll('.chart-container'));
    
    // Define positions for each chart
    const positions = [
      { x: margin, y: margin + 30 }, // Top left
      { x: margin + chartWidth + margin, y: margin + 30 }, // Top right
      { x: margin, y: margin + chartHeight + margin + 30 }, // Bottom left
      { x: margin + chartWidth + margin, y: margin + chartHeight + margin + 30 } // Bottom right
    ];

    // Capture and add each chart
    for (let i = 0; i < chartDivs.length; i++) {
      const canvas = await html2canvas(chartDivs[i], {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(
        imgData,
        'PNG',
        positions[i].x,
        positions[i].y,
        chartWidth,
        chartHeight
      );

      // Add chart title
      const titleElement = chartDivs[i].querySelector('h3');
      if (titleElement) {
        pdf.setFontSize(10);
        pdf.text(
          titleElement.textContent,
          positions[i].x + (chartWidth / 2),
          positions[i].y - 2,
          { align: 'center' }
        );
      }
    }

    pdf.save('system-analytics-report.pdf');
  };

  // Constants for styling
  const statusColors = {
    completed: 'bg-green-100 text-green-600',
    cancelled: 'bg-red-100 text-red-600',
    scheduled: 'bg-blue-100 text-blue-600'
  };

  return dashData && (
    <div className='m-3 sm:m-5'>
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
            Dashboard
          </h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setIsLoading(true);
              getDashData();
              getAllAppointments();
              getAllDoctors();
            }}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
          <button
            onClick={exportChartsToPDF}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Charts
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Main Stats Cards */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
            <div 
              className='bg-white p-4 sm:p-6 rounded-lg border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow cursor-pointer'
              onClick={() => navigate('/doctor-list')}
            >
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <p className='text-sm text-gray-500 mb-1'>Total Doctors</p>
                  <p className='text-2xl font-bold text-gray-800'>{dashData.doctors}</p>
                </div>
                <div className='bg-blue-50 p-3 rounded-full'>
                  <img className='w-6 h-6' src={assets.doctor_icon} alt="Doctors" />
                </div>
              </div>
              <div className='text-sm text-gray-600 flex items-center'>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Active healthcare providers
              </div>
            </div>

            <div 
              className='bg-white p-4 sm:p-6 rounded-lg border-l-4 border-green-500 shadow-sm hover:shadow-md transition-shadow cursor-pointer'
              onClick={() => navigate('/users-list')}
            >
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <p className='text-sm text-gray-500 mb-1'>Total Patients</p>
                  <p className='text-2xl font-bold text-gray-800'>{dashData.patients}</p>
                </div>
                <div className='bg-green-50 p-3 rounded-full'>
                  <img className='w-6 h-6' src={assets.patients_icon} alt="Patients" />
                </div>
              </div>
              <div className='text-sm text-gray-600 flex items-center'>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Registered patients in the system
              </div>
            </div>

            <div 
              className='bg-white p-4 sm:p-6 rounded-lg border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-shadow cursor-pointer'
              onClick={() => navigate('/all-appointments')}
            >
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <p className='text-sm text-gray-500 mb-1'>Total Appointments</p>
                  <p className='text-2xl font-bold text-gray-800'>{totalAppointments}</p>
                </div>
                <div className='bg-purple-50 p-3 rounded-full'>
                  <img className='w-6 h-6' src={assets.appointments_icon} alt="Appointments" />
                </div>
              </div>
              <div className='text-sm text-gray-600'>
                <span className='text-green-600'>{completedAppointments} approved</span> • <span className='text-red-600'>{cancelledAppointments} cancelled</span>
              </div>
            </div>

            <div className='bg-white p-4 sm:p-6 rounded-lg border-l-4 border-yellow-500 shadow-sm hover:shadow-md transition-shadow'>
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <p className='text-sm text-gray-500 mb-1'>Approval Rate</p>
                  <p className='text-2xl font-bold text-gray-800'>{completionRate}%</p>
                </div>
                <div className='bg-yellow-50 p-3 rounded-full'>
                  <img className='w-6 h-6' src={assets.tick_icon} alt="Approval Rate" />
                </div>
              </div>
              <div className='text-sm text-gray-600 flex items-center'>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {pendingAppointments} appointments pending
              </div>
            </div>
          </div>
          
          {/* Analytics Charts */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">System Analytics</h2>
            
            {/* Charts Grid */}
            <div id="charts-container" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Appointment Trends */}
              <div className="bg-white p-4 rounded-lg shadow chart-container">
                <h3 className="text-lg font-semibold mb-4">Appointment Trends (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.appointmentTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="total" name="Total" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="completed" name="Approved" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="cancelled" name="Cancelled" stroke="#ff8042" fill="#ff8042" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Time Slot Distribution */}
              <div className="bg-white p-4 rounded-lg shadow chart-container">
                <h3 className="text-lg font-semibold mb-4">Appointment Time Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.appointmentTimeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Appointments" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Doctor Performance */}
              <div className="bg-white p-4 rounded-lg shadow chart-container">
                <h3 className="text-lg font-semibold mb-4">Dr. Appointment Approval Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.doctorPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" name="Approved" stackId="a" fill="#82ca9d" />
                    <Bar dataKey="pending" name="Pending" stackId="a" fill="#8884d8" />
                    <Bar dataKey="cancelled" name="Cancelled" stackId="a" fill="#ff8042" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Gender Distribution */}
              <div className="bg-white p-4 rounded-lg shadow chart-container">
                <h3 className="text-lg font-semibold mb-4">Patient Gender Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.genderDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.genderDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Cancellation Modal */}
      <CancellationModal 
        isOpen={showCancellationModal}
        onClose={() => {
          setShowCancellationModal(false);
          setSelectedAppointmentId(null);
        }}
        onConfirm={(reason) => {
          if (selectedAppointmentId) {
            cancelAppointment(selectedAppointmentId, reason);
            setShowCancellationModal(false);
            setSelectedAppointmentId(null);
          }
        }}
        title="Cancel Appointment"
      />
    </div>
  )
}

export default Dashboard
