import React, { useState, useContext, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../context/AuthContext';
import { createLeaveRequest, getLeaveTypes, validateLeaveRequest } from '../api/api';

const LeaveForm = ({ onSuccess }) => {
  const { authData } = useContext(AuthContext);
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loadingLeaveTypes, setLoadingLeaveTypes] = useState(true);
  const [selectedLeaveType, setSelectedLeaveType] = useState(null);
  const [leaveValidation, setLeaveValidation] = useState(null);
  const [validatingDates, setValidatingDates] = useState(false);
  const [isBackdatedRequest, setIsBackdatedRequest] = useState(false);
  
  const watchLeaveType = watch('leaveTypeId');
  const watchStartDate = watch('startDate');
  const watchEndDate = watch('endDate');
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        setLoadingLeaveTypes(true);
        const response = await getLeaveTypes();
        setLeaveTypes(response.data);
      } catch (error) {
        console.error('Error fetching leave types:', error);
        setSubmitError('Failed to load leave types. Please refresh the page.');
      } finally {
        setLoadingLeaveTypes(false);
      }
    };

    fetchLeaveTypes();
  }, []);
  useEffect(() => {
    if (watchLeaveType && leaveTypes.length > 0) {
      const selected = leaveTypes.find(lt => lt.id === parseInt(watchLeaveType));
      setSelectedLeaveType(selected);
    }
  }, [watchLeaveType, leaveTypes]);

  // Check if the request is backdated
  useEffect(() => {
    if (watchStartDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(watchStartDate);
      setIsBackdatedRequest(startDate < today);
    } else {
      setIsBackdatedRequest(false);
    }
  }, [watchStartDate]);

  const isBackdatedAllowed = () => {
    if (!selectedLeaveType || !isBackdatedRequest) return true;
    
    // Only allow backdated requests for sick leave
    const isSickLeave = selectedLeaveType.name.toLowerCase().includes('sick');
    if (!isSickLeave) return false;
    
    // Check if within allowed backdated period (14 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(watchStartDate);
    const daysDiff = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
    
    return daysDiff <= 14;
  };

  // Validate dates when both start and end dates are selected
  useEffect(() => {
    const validateDates = async () => {
      if (watchStartDate && watchEndDate) {
        try {
          setValidatingDates(true);
          const response = await validateLeaveRequest(watchStartDate, watchEndDate);
          setLeaveValidation(response.data);
        } catch (error) {
          console.error('Error validating dates:', error);
          setLeaveValidation(null);
        } finally {
          setValidatingDates(false);
        }
      } else {
        setLeaveValidation(null);
      }
    };

    validateDates();
  }, [watchStartDate, watchEndDate]);

  const onSubmit = async (data) => {
    setLoading(true);
    setSubmitError('');
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(data.startDate);
      
      if (startDate < today) {
        // Check if backdated request is allowed
        if (!isBackdatedAllowed()) {
          const isSickLeave = selectedLeaveType?.name.toLowerCase().includes('sick');
          if (!isSickLeave) {
            setSubmitError('Backdated leave requests are only allowed for sick leave.');
          } else {
            setSubmitError('Backdated sick leave requests are only allowed within 14 days.');
          }
          setLoading(false);
          return;
        }
        
        // For backdated requests, justification is required
        if (!data.justification || data.justification.trim() === '') {
          setSubmitError('Justification is required for backdated leave requests.');
          setLoading(false);
          return;
        }
      }
      
      const formattedData = {
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason || `${selectedLeaveType?.name || 'Leave'} request`,
        leaveTypeId: parseInt(data.leaveTypeId),
        justification: data.justification || null,
        isBackdated: isBackdatedRequest
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
          <label htmlFor="leaveTypeId" className="block text-sm font-medium text-gray-700">Leave Type</label>
          <select
            id="leaveTypeId"
            {...register('leaveTypeId', { required: 'Leave type is required' })}
            className="mt-1 block w-full p-2 border rounded-md"
            disabled={loadingLeaveTypes}
          >
            <option value="">
              {loadingLeaveTypes ? 'Loading leave types...' : 'Select leave type'}
            </option>
            {leaveTypes.map((leaveType) => (
              <option key={leaveType.id} value={leaveType.id}>
                {leaveType.name} 
                {leaveType.maxDaysPerYear > 0 && ` (${leaveType.maxDaysPerYear} days/year)`}
              </option>
            ))}
          </select>
          {errors.leaveTypeId && <p className="text-red-500 text-sm">{errors.leaveTypeId.message}</p>}
          
          {/* Show leave type details */}
          {selectedLeaveType && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-medium text-blue-900">{selectedLeaveType.name}</h4>
              {selectedLeaveType.description && (
                <p className="text-sm text-blue-700 mt-1">{selectedLeaveType.description}</p>
              )}
              <div className="text-sm text-blue-600 mt-2">
                <p>• Max days per year: {selectedLeaveType.maxDaysPerYear || 'No limit'}</p>
                <p>• Requires approval: {selectedLeaveType.requiresApproval ? 'Yes' : 'No'}</p>
                {selectedLeaveType.requiresApproval && (
                  <p>• Approval levels: {selectedLeaveType.approvalLevels === 1 ? 'Manager only' : 'Manager + HR'}</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            id="startDate"
            min={selectedLeaveType?.name.toLowerCase().includes('sick') 
              ? new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0]}
            {...register('startDate', { 
              required: 'Start date is required',
              validate: {
                validBackdatedRequest: (value) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const selectedDate = new Date(value);
                  
                  if (selectedDate >= today) return true; // Future dates are always allowed
                  
                  // Past dates - check if it's allowed
                  if (!selectedLeaveType) return 'Please select a leave type first';
                  
                  const isSickLeave = selectedLeaveType.name.toLowerCase().includes('sick');
                  if (!isSickLeave) return 'Backdated requests are only allowed for sick leave';
                  
                  const daysDiff = Math.ceil((today - selectedDate) / (1000 * 60 * 60 * 24));
                  if (daysDiff > 14) return 'Backdated sick leave requests are only allowed within 14 days';
                  
                  return true;
                }
              }
            })}
            className="mt-1 block w-full p-2 border rounded-md"
          />
          {errors.startDate && <p className="text-red-500 text-sm">{errors.startDate.message}</p>}
        </div>
        
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            id="endDate"
            min={watchStartDate || new Date().toISOString().split('T')[0]}
            {...register('endDate', { 
              required: 'End date is required',
              validate: {
                afterStartDate: (value, formValues) => 
                  !formValues.startDate || new Date(value) >= new Date(formValues.startDate) || 
                  'End date must be on or after start date',
                validBackdatedEndDate: (value, formValues) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const selectedDate = new Date(value);
                  
                  if (selectedDate >= today) return true; // Future dates are always allowed
                  
                  // If start date is also in the past, allow it for sick leave
                  if (formValues.startDate) {
                    const startDate = new Date(formValues.startDate);
                    if (startDate < today && selectedLeaveType?.name.toLowerCase().includes('sick')) {
                      const daysDiff = Math.ceil((today - selectedDate) / (1000 * 60 * 60 * 24));
                      if (daysDiff <= 14) return true;
                    }
                  }
                  
                  return selectedDate >= today || 'End date cannot be in the past unless it\'s for backdated sick leave';
                }
              }
            })}
            className="mt-1 block w-full p-2 border rounded-md"
          />
          {errors.endDate && <p className="text-red-500 text-sm">{errors.endDate.message}</p>}
        </div>

        {/* Weekend Information */}
        {validatingDates && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-sm text-gray-600">Calculating working days...</p>
          </div>
        )}
        
        {leaveValidation && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h4 className="font-medium text-green-900 mb-2">📅 Leave Days Calculation</h4>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>Total days selected:</strong> {leaveValidation.totalDays}</p>
              <p><strong>Working days (will be deducted):</strong> {leaveValidation.workingDays}</p>
              {leaveValidation.weekendDays > 0 && (
                <>
                  <p><strong>Weekend days (excluded):</strong> {leaveValidation.weekendDays}</p>
                  <div className="mt-2">
                    <p className="font-medium">Weekend dates excluded:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {leaveValidation.weekends.map((weekend, index) => (
                        <span key={index} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                          {new Date(weekend).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="mt-3 p-2 bg-green-100 rounded">
              <p className="text-sm text-green-800">{leaveValidation.message}</p>
            </div>
          </div>
        )}
        
        {/* Justification field for backdated requests */}
        {isBackdatedRequest && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h4 className="text-sm font-medium text-yellow-800">Backdated Leave Request</h4>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              You are applying for leave in the past. This requires justification and may need HR approval.
            </p>
            <label htmlFor="justification" className="block text-sm font-medium text-yellow-800">
              Justification for Backdated Request *
            </label>
            <textarea
              id="justification"
              {...register('justification', { 
                required: isBackdatedRequest ? 'Justification is required for backdated requests' : false 
              })}
              className="mt-1 block w-full p-2 border border-yellow-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
              rows="3"
              placeholder="Please explain why you are applying for leave retroactively (e.g., sudden illness, emergency, forgot to apply earlier)"
            />
            {errors.justification && <p className="text-red-500 text-sm mt-1">{errors.justification.message}</p>}
          </div>
        )}

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
