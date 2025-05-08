import React, { useEffect, useState } from 'react';
import axios from 'axios';

const LeaveHistory = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get('/api/leave/history', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setHistory(response.data);
      } catch (error) {
        console.error('Error fetching leave history:', error);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Leave History</h2>
      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left border-b">Leave Type</th>
            <th className="px-4 py-2 text-left border-b">Start Date</th>
            <th className="px-4 py-2 text-left border-b">End Date</th>
            <th className="px-4 py-2 text-left border-b">Status</th>
          </tr>
        </thead>
        <tbody>
          {history.map((leave) => (
            <tr key={leave.id}>
              <td className="px-4 py-2 border-b">{leave.leaveType}</td>
              <td className="px-4 py-2 border-b">{leave.startDate}</td>
              <td className="px-4 py-2 border-b">{leave.endDate}</td>
              <td className="px-4 py-2 border-b">{leave.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaveHistory;
