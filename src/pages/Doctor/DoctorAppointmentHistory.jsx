import React, { useContext, useEffect, useState, useRef } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import ConsultationSummaryModal from '../../components/ConsultationSummaryModal'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const DoctorAppointmentHistory = () => {
  const { dToken, appointmentHistory, getAppointmentHistory, addConsultationSummary } = useContext(DoctorContext)
  const { slotDateFormat } = useContext(AppContext)
  const [searchTerm, setSearchTerm] = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  const tableRef = useRef(null)
  
  // State for consultation summary modal
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null)
  const [existingSummary, setExistingSummary] = useState('')

  useEffect(() => {
    if (dToken) {
      getAppointmentHistory()
    }
  }, [dToken])

  // Filter appointments based on search term
  const filteredAppointments = appointmentHistory.filter(app => {
    // Filter by search term
    if (searchTerm.trim() === '') return true;
    
    const fullName = `${app.userData.lastName} ${app.userData.firstName} ${app.userData.middleName}`.toLowerCase();
    const date = slotDateFormat(app.slotDate).toLowerCase();
    const time = app.slotTime.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return fullName.includes(searchLower) || date.includes(searchLower) || time.includes(searchLower);
  });

  // Function to export the current table to PDF
  const exportToPDF = async () => {
    if (!tableRef.current) return;
    
    setExportLoading(true);
    try {
      // Get the appointments to export (filtered or all)
      const appointmentsToExport = filteredAppointments;
      
      // Initialize PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      
      // Add title to first page
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Appointment History Report', pageWidth / 2, margin + 10, { align: 'center' });
      
      // Add date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, margin + 18, { align: 'center' });
      
      // Constants for pagination
      const rowsPerPage = 15;
      const headerHeight = 35; // Space for title, date, and filter info on first page
      const rowHeight = 15; // Approximate height of each row in mm
      const pageStartY = margin + (pdf.getNumberOfPages() === 1 ? headerHeight : 15);
      
      // Function to add header row
      const addTableHeader = (startY) => {
        pdf.setFillColor(243, 244, 246); // #f3f4f6
        pdf.rect(margin, startY, contentWidth, 8, 'F');
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(107, 114, 128); // #6b7280
        
        // Column positions and widths (in percentage of contentWidth)
        const columns = [
          { text: '#', width: 5, align: 'left' },
          { text: 'PATIENT', width: 30, align: 'left' },
          { text: 'DATE & TIME', width: 25, align: 'left' },
          { text: 'SUMMARY STATUS', width: 40, align: 'center' }
        ];
        
        let xPos = margin;
        columns.forEach(col => {
          const colWidth = (contentWidth * col.width) / 100;
          pdf.text(col.text, xPos + 2, startY + 5, { align: col.align === 'center' ? 'center' : 'left' });
          xPos += colWidth;
        });
        
        return startY + 8; // Return the Y position after the header
      };
      
      // Function to add a row
      const addTableRow = (item, index, startY) => {
        const rowStartY = startY;
        pdf.setDrawColor(229, 231, 235); // #e5e7eb
        pdf.setLineWidth(0.1);
        
        // Set text properties
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(55, 65, 81); // #374151
        
        // Column positions (same as header)
        const columns = [
          { width: 5, align: 'left' }, // #
          { width: 30, align: 'left' }, // Patient
          { width: 25, align: 'left' }, // Date & Time
          { width: 40, align: 'center' } // Summary Status
        ];
        
        // Draw row index
        let xPos = margin;
        let colWidth = (contentWidth * columns[0].width) / 100;
        pdf.text((index + 1).toString(), xPos + 2, rowStartY + 4);
        xPos += colWidth;
        
        // Draw patient name
        colWidth = (contentWidth * columns[1].width) / 100;
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${item.userData.lastName}, ${item.userData.firstName}`, xPos + 2, rowStartY + 4);
        if (item.userData.middleName) {
          pdf.setFont('helvetica', 'normal');
          pdf.text(item.userData.middleName || '—', xPos + 2, rowStartY + 8);
        }
        xPos += colWidth;
        
        // Draw date and time
        colWidth = (contentWidth * columns[2].width) / 100;
        pdf.setFont('helvetica', 'normal');
        const formattedDate = slotDateFormat(item.slotDate);
        pdf.text(formattedDate, xPos + 2, rowStartY + 4);
        pdf.text(item.slotTime, xPos + 2, rowStartY + 8);
        xPos += colWidth;
        
        // Draw summary status with colored background
        colWidth = (contentWidth * columns[3].width) / 100;
        const statusX = xPos + (colWidth / 2);
        const statusText = item.consultationSummary ? 'Summary Added' : 'No Summary';
        
        // Set status colors
        if (item.consultationSummary) {
          pdf.setFillColor(209, 250, 229); // #d1fae5
          pdf.setTextColor(4, 120, 87); // #047857
        } else {
          pdf.setFillColor(254, 243, 199); // #fef3c7
          pdf.setTextColor(146, 64, 14); // #92400e
        }
        
        // Draw status pill
        const pillWidth = 20;
        const pillHeight = 5;
        const pillX = statusX - (pillWidth / 2);
        const pillY = rowStartY + 2;
        pdf.roundedRect(pillX, pillY, pillWidth, pillHeight, 2, 2, 'F');
        
        // Draw status text
        pdf.text(statusText, statusX, rowStartY + 5.5, { align: 'center' });
        
        // Reset text color
        pdf.setTextColor(55, 65, 81); // #374151
        
        // Draw bottom border
        pdf.line(margin, rowStartY + rowHeight, margin + contentWidth, rowStartY + rowHeight);
        
        return rowStartY + rowHeight; // Return the Y position after the row
      };
      
      // Process appointments in batches for each page
      let currentPage = 1;
      let currentY = pageStartY;
      
      // Add header to first page
      currentY = addTableHeader(currentY);
      
      // Add rows
      for (let i = 0; i < appointmentsToExport.length; i++) {
        // Check if we need to start a new page
        if (i > 0 && i % rowsPerPage === 0) {
          pdf.addPage();
          currentPage++;
          currentY = margin + 15;
          currentY = addTableHeader(currentY);
        }
        
        currentY = addTableRow(appointmentsToExport[i], i, currentY);
      }
      
      // Save the PDF
      pdf.save('appointment-history.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setExportLoading(false);
    }
  };

  // Function to handle opening the summary modal
  const handleOpenSummaryModal = (appointmentId, existingSummary = '') => {
    setSelectedAppointmentId(appointmentId)
    setExistingSummary(existingSummary)
    setShowSummaryModal(true)
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Appointment History</h1>
        
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <img
              src={assets.search_icon}
              alt="Search"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
            />
          </div>
          
          <button
            onClick={exportToPDF}
            disabled={exportLoading || filteredAppointments.length === 0}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-white ${
              exportLoading || filteredAppointments.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {exportLoading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <img src={assets.download_icon} alt="Export" className="w-4 h-4" />
                <span>Export PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table ref={tableRef} className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consultation Summary
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.userData.lastName}, {appointment.userData.firstName} {appointment.userData.middleName}
                          </div>
                          <div className="text-sm text-gray-500">{appointment.userData.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{slotDateFormat(appointment.slotDate)}</div>
                      <div className="text-sm text-gray-500">{appointment.slotTime}</div>
                    </td>
                    <td className="px-6 py-4">
                      {appointment.consultationSummary ? (
                        <div>
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Summary Added
                          </span>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {appointment.consultationSummary}
                          </p>
                        </div>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          No Summary
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenSummaryModal(appointment._id, appointment.consultationSummary || '')}
                        className="text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded-full transition-colors"
                      >
                        {appointment.consultationSummary ? 'Edit Summary' : 'Add Summary'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? 'No appointments found matching your search.' : 'No completed appointments found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Consultation Summary Modal */}
      <ConsultationSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        onSubmit={addConsultationSummary}
        appointmentId={selectedAppointmentId}
        existingSummary={existingSummary}
      />
    </div>
  )
}

export default DoctorAppointmentHistory
