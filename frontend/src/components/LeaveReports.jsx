import React, { useState } from 'react';
import { getDashboardData } from '../api/api';

const LeaveReports = () => {
  const [reportType, setReportType] = useState('monthly');
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [department, setDepartment] = useState('all');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const departments = [
    { id: 'all', name: 'All Departments' },
    { id: 'hr', name: 'Human Resources' },
    { id: 'it', name: 'Information Technology' },
    { id: 'finance', name: 'Finance' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'operations', name: 'Operations' }
  ];

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      // In a real application, you would pass the report parameters to the API
      const response = await getDashboardData();
      
      // Simulate processing the data based on selected parameters
      const processedData = {
        ...response.data,
        reportType,
        dateRange,
        department,
        // Add some mock statistics
        statistics: {
          totalLeaveRequests: 45,
          approvedRequests: 32,
          rejectedRequests: 8,
          pendingRequests: 5,
          averageLeaveDuration: 3.5,
          mostCommonLeaveType: 'Annual Leave'
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
    // In a real application, this would generate a CSV or PDF file
    alert('Report export functionality would be implemented here.');
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
          
          {/* This would be a chart in a real application */}
          <div className="bg-gray-100 p-6 rounded-lg text-center h-64 flex items-center justify-center">
            <p className="text-gray-500">
              [Leave Distribution Chart Would Appear Here]
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveReports;