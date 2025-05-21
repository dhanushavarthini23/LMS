import React, { useState, useEffect } from 'react';
import { getEmployees, getDelegations, createDelegation, cancelDelegation } from '../api/api';

const DelegateAuthority = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [delegationPeriod, setDelegationPeriod] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0]
  });
  const [delegationReason, setDelegationReason] = useState('');
  const [delegations, setDelegations] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch potential delegates
        const employeesResponse = await getEmployees();
        const potentialDelegates = employeesResponse.data.filter(emp => 
          emp.role === 'Manager' || // Include managers
          emp.position?.toLowerCase().includes('senior') || 
          emp.position?.toLowerCase().includes('lead')
        );
        setTeamMembers(potentialDelegates);
        
        // Fetch existing delegations
        const delegationsResponse = await getDelegations();
        if (delegationsResponse.data) {
          setDelegations(delegationsResponse.data);
        }
        
        setError('');
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelegateAuthority = async () => {
    if (!selectedEmployee || !delegationReason) {
      setError('Please select an employee and provide a reason for delegation.');
      return;
    }
    const selectedEmployeeObj = teamMembers.find(emp => emp.id === selectedEmployee);try {
      setLoading(true);
      
      // Call the API to create a delegation
    
  const response = await createDelegation(
        selectedEmployee,
        delegationPeriod.startDate,
        delegationPeriod.endDate,
        delegationReason
      );
      
      if (response.data) {
        // Add the new delegation to the list
        setDelegations([response.data, ...delegations]);
        
        // Reset form
        setSelectedEmployee('');
        setDelegationReason('');
        setDelegationPeriod({
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0]
        });
        alert('Authority delegation request submitted successfully!');
      }
    } catch (error) {
      console.error('Error creating delegation:', error);
      setError('Failed to create delegation. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelegation = async (id) => {
    const updatedDelegations = delegations.map(delegation => 
          delegation.id === id ? { ...delegation, status: 'Cancelled' } : delegation
        );
    try {
      setLoading(true);
      
      // Call the API to cancel the delegation
      const response = await cancelDelegation(id);
      
      if (response.data) {
        // Update the delegation in the list
                setDelegations(updatedDelegations);
      }
    } catch (error) {
      console.error('Error cancelling delegation:', error);
      setError('Failed to cancel delegation. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Delegate Approval Authority</h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Delegate Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delegate To</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="border rounded w-full p-2"
              >
                <option value="">Select an employee</option>
                {teamMembers.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.position}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Delegation Period */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={delegationPeriod.startDate}
                  onChange={(e) => setDelegationPeriod({ ...delegationPeriod, startDate: e.target.value })}
                  className="border rounded w-full p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={delegationPeriod.endDate}
                  onChange={(e) => setDelegationPeriod({ ...delegationPeriod, endDate: e.target.value })}
                  className="border rounded w-full p-2"
                />
              </div>
            </div>
          </div>
          
          {/* Delegation Reason */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Delegation</label>
            <textarea
              value={delegationReason}
              onChange={(e) => setDelegationReason(e.target.value)}
              className="border rounded w-full p-2 h-24"
              placeholder="Explain why you need to delegate your approval authority..."
            ></textarea>
          </div>
          
          <div className="flex justify-center mb-8">
            <button
              onClick={handleDelegateAuthority}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Delegate Authority
            </button>
          </div>
          
          {/* Current Delegations */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Current & Past Delegations</h3>
            
            {delegations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No delegations found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delegate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {delegations.map((delegation) => (
                      <tr key={delegation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {delegation.delegateName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(delegation.startDate)} - {formatDate(delegation.endDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {delegation.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${delegation.status === 'Active' ? 'bg-green-100 text-green-800' : 
                              delegation.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                              delegation.status === 'Completed' ? 'bg-blue-100 text-blue-800' : 
                              'bg-red-100 text-red-800'}`}>
                            {delegation.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(delegation.status === 'Active' || delegation.status === 'Pending') && (
                            <button
                              onClick={() => handleCancelDelegation(delegation.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DelegateAuthority;