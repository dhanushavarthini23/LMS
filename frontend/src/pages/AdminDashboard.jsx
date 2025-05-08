import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        const response = await axios.get('/api/admin/get-all-leave-requests', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setLeaveRequests(response.data);
      } catch (error) {
        console.error('Error fetching leave requests:', error);
      }
    };

    fetchLeaveRequests();
  }, []);

  const handleApprove = async (id) => {
    try {
      await axios.put(`/api/approve-leave/${id}`, null, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setLeaveRequests(leaveRequests.filter((request) => request.id !== id));
    } catch (error) {
      console.error('Error approving leave:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.put(`/api/admin/reject-leave/${id}`, null, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setLeaveRequests(leaveRequests.filter((request) => request.id !== id));
    } catch (error) {
      console.error('Error rejecting leave:', error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Admin Dashboard</h2>
      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left border-b">Employee Name</th>
            <th className="px-4 py-2 text-left border-b">Leave Type</th>
            <th className="px-4 py-2 text-left border-b">Start Date</th>
            <th className="px-4 py-2 text-left border-b">End Date</th>
            <th className="px-4 py-2 text-left border-b">Action</th>
          </tr>
        </thead>
        <tbody>
          {leaveRequests.map((request) => (
            <tr key={request.id}>
              <td className="px-4 py-2 border-b">{request.employeeName}</td>
              <td className="px-4 py-2 border-b">{request.leaveType}</td>
              <td className="px-4 py-2 border-b">{request.startDate}</td>
              <td className="px-4 py-2 border-b">{request.endDate}</td>
              <td className="px-4 py-2 border-b">
                <button
                  onClick={() => handleApprove(request.id)}
                  className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
