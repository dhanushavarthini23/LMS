import React, { useState, useEffect } from 'react';
import { getEmployees, getLeaveBalance } from '../api/api';

const TeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [showLeaveBalance, setShowLeaveBalance] = useState(false);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        const response = await getEmployees();
        
        
        const enhancedTeamData = response.data.map(employee => ({
          ...employee,
          position: employee.position || employee.role || 'Staff',
          department: employee.department?.name || employee.department || 'General',
          annualLeaveBalance: employee.annualLeaveBalance || 20,
          sickLeaveBalance: employee.sickLeaveBalance || 10,
          personalLeaveBalance: employee.personalLeaveBalance || 5,
          totalLeaveBalance: (employee.annualLeaveBalance || 20) + (employee.sickLeaveBalance || 10) + (employee.personalLeaveBalance || 5)
        }));
        
        setTeamMembers(enhancedTeamData);
        setError('');
      } catch (error) {
        console.error('Error fetching team members:', error);
        setError('Failed to load team members. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  const handleViewLeaveBalance = async (employeeId) => {
    try {
      setLoading(true);
      const employee = teamMembers.find(emp => emp.id === employeeId);
      const response = await getLeaveBalance(employeeId);
      const balance = response.data.leaveBalance || response.data;
      
      setLeaveBalance(balance);
      setSelectedEmployee(employee);
      setShowLeaveBalance(true);
      setError('');
    } catch (error) {
      console.error('Error fetching leave balance:', error);
      setError('Failed to load leave balance. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseLeaveBalance = () => {
    setShowLeaveBalance(false);
    setSelectedEmployee(null);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Team Management</h2>
      
      {loading && !showLeaveBalance ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : (
        <>
          {/* Team Members Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamMembers.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {employee.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {employee.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {employee.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {employee.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Annual: {employee.annualLeaveBalance !== undefined ? employee.annualLeaveBalance : employee.leaveBalance || 20} days
                        </span>
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Sick: {employee.sickLeaveBalance !== undefined ? employee.sickLeaveBalance : 10} days
                        </span>
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          Personal: {employee.personalLeaveBalance !== undefined ? employee.personalLeaveBalance : 5} days
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewLeaveBalance(employee.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Leave Balance Modal */}
          {showLeaveBalance && selectedEmployee && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Leave Balance: {selectedEmployee.name}
                  </h3>
                  <button
                    onClick={handleCloseLeaveBalance}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {leaveBalance?.balances ? (
                      Object.entries(leaveBalance.balances).map(([leaveType, balance]) => (
                        <div key={leaveType} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{leaveType}:</span>
                            <span className="text-xs text-gray-600">
                              Taken: {balance.taken} | Entitlement: {balance.entitlement}
                            </span>
                          </div>
                          <span className="font-bold text-blue-600">
                            {balance.remaining === 'N/A' ? 'Case by case' : `${balance.remaining} days`}
                          </span>
                        </div>
                      ))
                    ) : (
                      // Fallback for old format
                      <>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">Annual Leave:</span>
                          <span className="font-bold text-blue-600">{leaveBalance?.annual || 20} days</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">Sick Leave:</span>
                          <span className="font-bold text-blue-600">{leaveBalance?.sick || 10} days</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">Personal Leave:</span>
                          <span className="font-bold text-blue-600">{leaveBalance?.personal || 5} days</span>
                        </div>
                      </>
                    )}
                    
                    <div className="border-t pt-3 mt-4">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded font-semibold">
                        <span>Total Taken:</span>
                        <span className="text-blue-800">{leaveBalance?.totalTaken || 0} days</span>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <button
                        onClick={handleCloseLeaveBalance}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeamManagement;