import React, { useEffect, useState } from 'react';
import { getLeaveHistory } from '../api/api';

const LeaveHistory = ({ limit }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await getLeaveHistory();
        
        
        if (Array.isArray(response.data)) {
          setHistory(response.data);
        } else {
          console.warn('Leave history response is not an array:', response.data);
          setHistory([]); //fallback
        }
        
        setError('');
      } catch (error) {
        console.error('Error fetching leave history:', error);
        setError('Failed to load leave history. Please try again later.');
        setHistory([]); 
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  
  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };

  return (
    <div className={limit ? "" : "bg-white shadow rounded-lg p-6"}>
      {!limit && <h2 className="text-xl font-semibold mb-4">Leave History</h2>}
      
      {loading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {!loading && !error && history.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No leave history available.
        </div>
      )}
      
      {!loading && !error && history.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(limit ? history.slice(0, limit) : history).map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {leave.leaveType || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(leave.startDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(leave.endDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {calculateDuration(leave.startDate, leave.endDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      leave.status === 'Approved' 
                        ? 'bg-green-100 text-green-800' 
                        : leave.status === 'Rejected' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaveHistory;
