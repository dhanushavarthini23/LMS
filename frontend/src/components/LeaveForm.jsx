import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const LeaveForm = () => {
  const { authData } = useContext(AuthContext);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await axios.post('/api/leave', data, {
        headers: {
          Authorization: `Bearer ${authData.token}`,
        },
      });
      alert('Leave request submitted successfully!');
    } catch (error) {
      console.error('Error submitting leave request:', error);
      alert('Error submitting leave request.');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white shadow-md rounded">
      <h2 className="text-xl font-semibold mb-4">Submit Leave Request</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700">Leave Type</label>
          <select
            id="leaveType"
            {...register('leaveType', { required: 'Leave type is required' })}
            className="mt-1 block w-full p-2 border rounded-md"
          >
            <option value="sick">Sick Leave</option>
            <option value="vacation">Vacation</option>
          </select>
          {errors.leaveType && <p className="text-red-500 text-sm">{errors.leaveType.message}</p>}
        </div>
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            id="startDate"
            {...register('startDate', { required: 'Start date is required' })}
            className="mt-1 block w-full p-2 border rounded-md"
          />
          {errors.startDate && <p className="text-red-500 text-sm">{errors.startDate.message}</p>}
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            id="endDate"
            {...register('endDate', { required: 'End date is required' })}
            className="mt-1 block w-full p-2 border rounded-md"
          />
          {errors.endDate && <p className="text-red-500 text-sm">{errors.endDate.message}</p>}
        </div>
        <button
          type="submit"
          className={`w-full py-2 mt-4 text-white rounded ${loading ? 'bg-gray-400' : 'bg-blue-500'}`}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Leave Request'}
        </button>
      </form>
    </div>
  );
};

export default LeaveForm;
