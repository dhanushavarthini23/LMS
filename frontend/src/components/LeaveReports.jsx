import React, { useState, useEffect } from 'react';
import { getDashboardData, getAllLeaveRequests } from '../api/api';

const LeaveReports = () => {
  const [reportType, setReportType] = useState('yearly');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(2024, 0, 1).toISOString().split('T')[0], // January 1, 2024
    endDate: new Date(2025, 11, 31).toISOString().split('T')[0] // December 31, 2025
  });
  const [department, setDepartment] = useState('all');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allLeaveRequests, setAllLeaveRequests] = useState([]);
  
  // Fetch all leave requests when component mounts
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        setLoading(true);
        const response = await getAllLeaveRequests();
        if (response.data) {
          console.log('Fetched leave requests:', response.data);
          console.log('Sample request structure:', response.data[0]);
          setAllLeaveRequests(response.data);
        }
      } catch (error) {
        console.error('Error fetching leave requests:', error);
        setError('Failed to load leave data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaveRequests();
  }, []);

  const departments = [
    { id: 'all', name: 'All Departments' },
    { id: 'Human Resources', name: 'Human Resources' },
    { id: 'Information Technology', name: 'Information Technology' },
    { id: 'Finance', name: 'Finance' },
    { id: 'Marketing', name: 'Marketing' },
    { id: 'Operations', name: 'Operations' }
  ];

  
  useEffect(() => {
    const today = new Date();
    let start = new Date();
    
    switch(reportType) {
      case 'daily':
        // Today
        start = new Date(today);
        break;
      case 'weekly':
        // Start of current week 
        start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        break;
      case 'monthly':
        // Start of current month
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'yearly':
        // Start of current year to end of next year (to capture test data)
        start = new Date(today.getFullYear(), 0, 1);
        break;
      case 'custom':
        
        return;
      default:
        break;
    }
    
    let end = new Date(today);
    if (reportType === 'yearly') {
      // For yearly reports, include next year to capture test data
      end = new Date(today.getFullYear() + 1, 11, 31);
    }
    
    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
  }, [reportType]);

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      
     
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59); 
      
      
      let filteredRequests = allLeaveRequests.filter(request => {
        const requestStartDate = new Date(request.startDate);
        return requestStartDate >= startDate && requestStartDate <= endDate;
      });
      
      
      if (department !== 'all') {
        filteredRequests = filteredRequests.filter(request => {
          return request.employee?.department?.name?.toLowerCase() === department.toLowerCase();
        });
      }
      
      
      const totalLeaveRequests = filteredRequests.length;
      const approvedRequests = filteredRequests.filter(req => req.status === 'Approved').length;
      const rejectedRequests = filteredRequests.filter(req => req.status === 'Rejected').length;
      const pendingRequests = filteredRequests.filter(req => ['Pending', 'Manager Approved'].includes(req.status)).length;
      
      
      let totalDays = 0;
      filteredRequests.forEach(req => {
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
        totalDays += days;
      });
      const averageLeaveDuration = totalLeaveRequests > 0 ? (totalDays / totalLeaveRequests).toFixed(1) : 0;
      
      // Find most common leave type
      const leaveTypeCounts = {};
      filteredRequests.forEach(req => {
        const leaveTypeName = req.leaveType?.name || 'Unknown';
        leaveTypeCounts[leaveTypeName] = (leaveTypeCounts[leaveTypeName] || 0) + 1;
      });
      
      let mostCommonLeaveType = 'None';
      let maxCount = 0;
      
      Object.entries(leaveTypeCounts).forEach(([type, count]) => {
        if (count > maxCount) {
          mostCommonLeaveType = type;
          maxCount = count;
        }
      });
      
      // Cretion of the report data
      const processedData = {
        reportType,
        dateRange,
        department,
        filteredRequests,
        statistics: {
          totalLeaveRequests,
          approvedRequests,
          rejectedRequests,
          pendingRequests,
          averageLeaveDuration,
          mostCommonLeaveType
        }
      };
      
      setReportData(processedData);
      setError('');
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    if (!reportData || !reportData.filteredRequests) {
      alert('No report data to export.');
      return;
    }
    
    // Create CSV content
    let csvContent = 'Employee,Leave Type,Start Date,End Date,Duration,Status\n';
    
    reportData.filteredRequests.forEach(request => {
      const startDate = new Date(request.startDate).toLocaleDateString();
      const endDate = new Date(request.endDate).toLocaleDateString();
      const duration = Math.round((new Date(request.endDate) - new Date(request.startDate)) / (1000 * 60 * 60 * 24)) + 1;
      
      csvContent += `"${request.employee?.name || 'Unknown'}","${request.leaveType || 'Annual Leave'}","${startDate}","${endDate}","${duration} days","${request.status}"\n`;
    });
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leave_report_${reportType}_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Leave Reports</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Report Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="border rounded w-full p-2"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        
        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="border rounded w-full p-2"
          />
        </div>
        
        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="border rounded w-full p-2"
          />
        </div>
        
        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="border rounded w-full p-2"
          >
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex justify-center mb-6">
        <button
          onClick={handleGenerateReport}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2"
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {reportData && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Report Results</h3>
            <button
              onClick={handleExportReport}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
            >
              Export Report
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded shadow">
              <h4 className="font-medium text-blue-800 mb-2">Total Leave Requests</h4>
              <p className="text-2xl font-bold text-blue-600">{reportData.statistics.totalLeaveRequests}</p>
            </div>
            <div className="bg-green-50 p-4 rounded shadow">
              <h4 className="font-medium text-green-800 mb-2">Approved Requests</h4>
              <p className="text-2xl font-bold text-green-600">{reportData.statistics.approvedRequests}</p>
            </div>
            <div className="bg-red-50 p-4 rounded shadow">
              <h4 className="font-medium text-red-800 mb-2">Rejected Requests</h4>
              <p className="text-2xl font-bold text-red-600">{reportData.statistics.rejectedRequests}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-yellow-50 p-4 rounded shadow">
              <h4 className="font-medium text-yellow-800 mb-2">Pending Requests</h4>
              <p className="text-2xl font-bold text-yellow-600">{reportData.statistics.pendingRequests}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded shadow">
              <h4 className="font-medium text-purple-800 mb-2">Avg. Leave Duration</h4>
              <p className="text-2xl font-bold text-purple-600">{reportData.statistics.averageLeaveDuration} days</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded shadow">
              <h4 className="font-medium text-indigo-800 mb-2">Most Common Leave Type</h4>
              <p className="text-xl font-bold text-indigo-600">{reportData.statistics.mostCommonLeaveType}</p>
            </div>
          </div>
          
          {/* Leave Requests Table */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Leave Requests in Report Period</h3>
            {reportData.filteredRequests.length === 0 ? (
              <div className="bg-gray-100 p-6 rounded-lg text-center">
                <p className="text-gray-500">No leave requests found for the selected criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.filteredRequests.map((request) => {
                      const startDate = new Date(request.startDate);
                      const endDate = new Date(request.endDate);
                      const duration = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                      
                      return (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {request.employee?.name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {request.leaveType?.name || 'Annual Leave'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {startDate.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {endDate.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {duration} day{duration !== 1 ? 's' : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${request.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                                request.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'}`}>
                              {request.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveReports;