import React, { useEffect, useState, useContext } from 'react';
import { getLeaveRequests } from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from 'react-router-dom'; // For redirecting if not logged in

const LeaveRequestsPage = () => {
  const { authData } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      if (!authData?.token) return;
      try {
        setLoading(true);
        const response = await getLeaveRequests(authData.token);
        setRequests(response.data);
      } catch (error) {
        setError('Error fetching leave requests');
        console.error('Error fetching leave requests:', error);
      } finally {
        setLoading(false);
      }
    };

    if (authData?.token) {
      fetchRequests();
    }
  }, [authData]);

  if (!authData?.token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Leave Requests</h1>

      {loading && <p>Loading...</p>}  {/* Loading state */}
      {error && <p className="text-red-500">{error}</p>}  {/* Error state */}

      {!loading && requests.length === 0 && <p>No leave requests available.</p>} {/* No data state */}

      {!loading && requests.length > 0 && (
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Employee ID</th>
              <th className="border px-4 py-2">Leave Type</th>
              <th className="border px-4 py-2">Start Date</th>
              <th className="border px-4 py-2">End Date</th>
              <th className="border px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td className="border px-4 py-2">{req.employee_id}</td>
                <td className="border px-4 py-2">{req.leave_type}</td>
                <td className="border px-4 py-2">{req.start_date}</td>
                <td className="border px-4 py-2">{req.end_date}</td>
                <td className="border px-4 py-2">{req.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LeaveRequestsPage;
