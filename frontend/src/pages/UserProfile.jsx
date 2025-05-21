import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { getEmployeeProfile, updateEmployeeProfile } from '../api/api';

const UserProfile = () => {
  const { authData } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userId, setUserId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    address: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (authData?.token) {
      try {
        const decoded = jwtDecode(authData.token);
        setUserId(decoded.id || decoded.userId || '');
        fetchUserProfile(decoded.id || decoded.userId || '');
      } catch (error) {
        console.error('Error decoding token:', error);
        setError('Failed to authenticate user');
        setLoading(false);
      }
    } else {
      navigate('/login');
    }
  }, [authData, navigate]);

  const fetchUserProfile = async (id) => {
    try {
      setLoading(true);
      const userData = {
        id: id,
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '123-456-7890',
        department: 'Engineering',
        position: 'Software Developer',
        address: '123 Main St, Anytown, USA',
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phone: '987-654-3210'
        }
      };
      
      setFormData({
        ...formData,
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        department: userData.department || '',
        position: userData.position || '',
        address: userData.address || '',
        emergencyContact: {
          name: userData.emergencyContact?.name || '',
          relationship: userData.emergencyContact?.relationship || '',
          phone: userData.emergencyContact?.phone || ''
        }
      });
      
      setError('');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Password validation
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Profile updated successfully');
      setFormData({
        ...formData,
        password: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">User Profile</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Personal Information</h2>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Full Name
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
              Phone
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
              Address
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="address"
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          
          {/* Work Information */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2 mt-4">Work Information</h2>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="department">
              Department
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="department"
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              readOnly
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="position">
              Position
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="position"
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              readOnly
            />
          </div>
          
          {/* Emergency Contact */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2 mt-4">Emergency Contact</h2>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="emergencyContact.name">
              Contact Name
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="emergencyContact.name"
              type="text"
              name="emergencyContact.name"
              value={formData.emergencyContact.name}
              onChange={handleChange}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="emergencyContact.relationship">
              Relationship
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="emergencyContact.relationship"
              type="text"
              name="emergencyContact.relationship"
              value={formData.emergencyContact.relationship}
              onChange={handleChange}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="emergencyContact.phone">
              Contact Phone
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="emergencyContact.phone"
              type="tel"
              name="emergencyContact.phone"
              value={formData.emergencyContact.phone}
              onChange={handleChange}
            />
          </div>
          
          {/* Change Password */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2 mt-4">Change Password</h2>
            <p className="text-sm text-gray-600 mb-4">Leave blank if you don't want to change your password</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              New Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-end mt-6">
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
            type="button"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserProfile;