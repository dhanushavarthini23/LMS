import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../context/AuthContext';
import { createEmployee } from '../api/api';

const EmployeeForm = ({ onSuccess }) => {
  const { authData } = useContext(AuthContext);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const onSubmit = async (data) => {
    setLoading(true);
    setSubmitError('');
    
    try {
      // Format the data according to the backend API
      const formattedData = {
        name: data.name,
        email: data.email,
        role: data.role,
        username: data.email.split('@')[0], // Generate username from email
        password: 'password123', // Default password
        department: data.department
      };
      
      await createEmployee(formattedData);
      
      // Reset form and show success message
      reset();
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      } else {
        alert('Employee created successfully!');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      setSubmitError(error.response?.data?.message || 'Error creating employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white shadow-md rounded">
      <h2 className="text-xl font-semibold mb-4">Create New Employee</h2>
      
      {submitError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {submitError}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            id="name"
            {...register('name', { required: 'Full name is required' })}
            className="mt-1 block w-full p-2 border rounded-md"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            className="mt-1 block w-full p-2 border rounded-md"
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
        </div>
        
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
          <select
            id="role"
            {...register('role', { required: 'Role is required' })}
            className="mt-1 block w-full p-2 border rounded-md"
          >
            <option value="">Select role</option>
            <option value="Employee">Employee</option>
            <option value="Manager">Manager</option>
            <option value="HR">HR</option>
          </select>
          {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
        </div>
        
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
          <select
            id="department"
            {...register('department', { required: 'Department is required' })}
            className="mt-1 block w-full p-2 border rounded-md"
          >
            <option value="">Select department</option>
            <option value="IT">IT</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="Marketing">Marketing</option>
            <option value="Operations">Operations</option>
            <option value="Sales">Sales</option>
            <option value="Engineering">Engineering</option>
            <option value="Customer Support">Customer Support</option>
          </select>
          {errors.department && <p className="text-red-500 text-sm">{errors.department.message}</p>}
        </div>
        
        <div className="pt-2">
          <p className="text-sm text-gray-500 mb-2">
            Note: A default password will be set. The employee can change it after first login.
          </p>
        </div>
        
        <button
          type="submit"
          className={`w-full py-2 mt-4 text-white rounded ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}`}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Employee'}
        </button>
      </form>
    </div>
  );
};

export default EmployeeForm;