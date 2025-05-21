import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../context/AuthContext';
import { createLeaveRequest } from '../api/api';

const LeaveForm = ({ onSuccess }) => {
  const { authData } = useContext(AuthContext);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const onSubmit = async (data) => {
    setLoading(true);
    setSubmitError('');
    
    try {
      
      const formattedData = {
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason || `${data.leaveType} leave`,
        leaveType: data.leaveType
      };
      
      await createLeaveRequest(formattedData);
      
     
      reset();
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      } else {
        alert('Leave request submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      setSubmitError(error.response?.data?.message || 'Error submitting leave request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white shadow-md rounded">
      <h2 className="text-xl font-semibold mb-4">Submit Leave Request</h2>
      
      {submitError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {submitError}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700">Leave Type</label>
          <select
            id="leaveType"
            {...register('leaveType', { required: 'Leave type is required' })}
            className="mt-1 block w-full p-2 border rounded-md"
          >
            <option value="">Select leave type</option>
            <option value="Annual Leave">Annual Leave</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Personal Leave">Personal Leave</option>
            <option value="Other">Other</option>
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
            {...register('endDate', { 
              required: 'End date is required',
              validate: {
                afterStartDate: (value, formValues) => 
                  !formValues.startDate || new Date(value) >= new Date(formValues.startDate) || 
                  'End date must be after start date'
              }
            })}
            className="mt-1 block w-full p-2 border rounded-md"
          />
          {errors.endDate && <p className="text-red-500 text-sm">{errors.endDate.message}</p>}
        </div>
        
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason (Optional)</label>
          <textarea
            id="reason"
            {...register('reason')}
            className="mt-1 block w-full p-2 border rounded-md"
            rows="3"
            placeholder="Provide details about your leave request"
          />
        </div>
        
        <button
          type="submit"
          className={`w-full py-2 mt-4 text-white rounded ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}`}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Leave Request'}
        </button>
      </form>
    </div>
  );
};

export default LeaveForm;
