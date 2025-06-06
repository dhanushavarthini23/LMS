import React, { useState } from 'react';
import { createLeaveType, updateLeaveType } from '../api/api';

const LeaveTypeManagement = ({ leaveTypes, onLeaveTypeUpdate }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxDaysPerYear: 0,
    requiresApproval: true,
    approvalLevels: 1,
    isActive: true,
    carryForwardAllowed: false,
    maxCarryForward: 0
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('LeaveTypeManagement: Submitting form data:', formData);
      
      if (editingLeaveType) {
        console.log('LeaveTypeManagement: Updating leave type ID:', editingLeaveType.id);
        await updateLeaveType(editingLeaveType.id, formData);
        setSuccess('Leave type updated successfully!');
      } else {
        console.log('LeaveTypeManagement: Creating new leave type');
        await createLeaveType(formData);
        setSuccess('Leave type created successfully!');
      }
      
      resetForm();
      onLeaveTypeUpdate();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save leave type');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      maxDaysPerYear: 0,
      requiresApproval: true,
      approvalLevels: 1,
      isActive: true,
      carryForwardAllowed: false,
      maxCarryForward: 0
    });
    setShowAddForm(false);
    setEditingLeaveType(null);
  };

  const handleEdit = (leaveType) => {
    setFormData({
      name: leaveType.name || '',
      description: leaveType.description || '',
      maxDaysPerYear: leaveType.maxDaysPerYear || 0,
      requiresApproval: leaveType.requiresApproval !== false,
      approvalLevels: leaveType.approvalLevels || 1,
      isActive: leaveType.isActive !== false,
      carryForwardAllowed: leaveType.carryForwardAllowed || false,
      maxCarryForward: leaveType.maxCarryForward || 0
    });
    setEditingLeaveType(leaveType);
    setShowAddForm(true);
  };

  const handleToggleStatus = async (leaveType) => {
    try {
      await updateLeaveType(leaveType.id, { 
        ...leaveType, 
        isActive: !leaveType.isActive 
      });
      setSuccess(`Leave type ${!leaveType.isActive ? 'activated' : 'deactivated'} successfully!`);
      onLeaveTypeUpdate();
    } catch (error) {
      setError('Failed to update leave type status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Leave Type Management</h2>
        <button
          onClick={() => {
            if (showAddForm) {
              resetForm();
            } else {
              setShowAddForm(true);
            }
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ Add Leave Type'}
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Add/Edit Leave Type Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">
            {editingLeaveType ? 'Edit Leave Type' : 'Add New Leave Type'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Annual Leave, Sick Leave"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Days Per Year</label>
              <input
                type="number"
                name="maxDaysPerYear"
                value={formData.maxDaysPerYear}
                onChange={handleInputChange}
                min="0"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0 for unlimited"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the leave type and its conditions..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Approval Levels</label>
              <select
                name="approvalLevels"
                value={formData.approvalLevels}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={1}>Manager Only</option>
                <option value={2}>Manager + HR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Carry Forward Days</label>
              <input
                type="number"
                name="maxCarryForward"
                value={formData.maxCarryForward}
                onChange={handleInputChange}
                min="0"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0 for no carry forward"
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="requiresApproval"
                  checked={formData.requiresApproval}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Requires Approval</label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="carryForwardAllowed"
                  checked={formData.carryForwardAllowed}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Allow Carry Forward</label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Active</label>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingLeaveType ? 'Update' : 'Create')} Leave Type
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leave Types List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Days/Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approval Required
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Carry Forward
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaveTypes.map((leaveType) => (
                <tr key={leaveType.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{leaveType.name}</div>
                      <div className="text-sm text-gray-500">{leaveType.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {leaveType.maxDaysPerYear || 'Unlimited'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      leaveType.requiresApproval ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {leaveType.requiresApproval ? `${leaveType.approvalLevels} Level(s)` : 'Auto-Approved'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {leaveType.carryForwardAllowed ? 
                      `${leaveType.maxCarryForward || 'Unlimited'} days` : 
                      'Not allowed'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      leaveType.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {leaveType.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(leaveType)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(leaveType)}
                      className={`${
                        leaveType.isActive !== false ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {leaveType.isActive !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {leaveTypes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No leave types found. Create your first leave type to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveTypeManagement;