import React, { useEffect, useState } from 'react';
import { getLeaveHistory, cancelLeaveRequest } from '../api/api';

const LeaveHistory = ({ limit, onLeaveUpdate }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await getLeaveHistory();
        
        console.log('Leave history response:', response.data);
        
        if (Array.isArray(response.data)) {
          // Log the first item to check its structure
          if (response.data.length > 0) {
            console.log('First leave item:', response.data[0]);
            console.log('Leave type:', response.data[0].leaveType);
          }
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

  const handleCancelRequest = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }

    try {
      setCancellingId(leaveId);
      await cancelLeaveRequest(leaveId);
      const response = await getLeaveHistory();
      if (Array.isArray(response.data)) {
        setHistory(response.data);
      }
      if (onLeaveUpdate) {
        onLeaveUpdate();
      }
      
      setError('');
    } catch (error) {
      console.error('Error cancelling leave request:', error);
      setError('Failed to cancel leave request. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const canCancelRequest = (leave) => {
    return leave.status === 'Pending';
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(limit ? history.slice(0, limit) : history).map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {leave.leaveType?.name || 
                     (typeof leave.leaveType === 'string' ? leave.leaveType : 'N/A')}
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    {canCancelRequest(leave) ? (
                      <button
                        onClick={() => handleCancelRequest(leave.id)}
                        disabled={cancellingId === leave.id}
                        className={`text-red-600 hover:text-red-900 text-sm font-medium ${
                          cancellingId === leave.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {cancellingId === leave.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
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
