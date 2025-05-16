import axios from 'axios';

const API_URL = 'http://localhost:5000'; // Backend URL

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication
export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    return response;
  } catch (error) {
    throw error.response ? error.response.data : 'Login failed';
  }
};

// Leave Requests
export const getLeaveRequests = async (token) => {
  return api.get('/api/leave-requests');
};

export const createLeaveRequest = async (data) => {
  return api.post('/api/leave-requests', data);
};

export const getLeaveHistory = async () => {
  return api.get('/api/leave-history');
};

export const getLeaveBalance = async () => {
  return api.get('/api/leave-balance');
};

// For managers and HR
export const getPendingLeaveRequests = async () => {
  return api.get('/api/leave-requests/pending');
};

export const approveLeaveRequestManager = async (leaveId, decision, comment = '') => {
  return api.post(`/api/leave-requests/${leaveId}/approve/manager`, {
    approved: decision,
    comment,
  });
};

export const approveLeaveRequestHR = async (leaveId, decision, comment = '') => {
  return api.post(`/api/leave-requests/${leaveId}/approve/hr`, {
    approved: decision,
    comment,
  });
};

// Dashboard
export const getDashboardData = async () => {
  return api.get('/api/dashboard');
};

// Employee Management
export const getEmployees = async () => {
  return api.get('/api/employees');
};

export const getEmployeeProfile = async (id) => {
  return api.get(`/api/employees/${id}`);
};

export const createEmployee = async (employeeData) => {
  return api.post('/api/employees', employeeData);
};

// Notifications
export const getNotifications = async () => {
  return api.get('/api/notifications');
};

export const markNotificationAsRead = async (id) => {
  return api.post(`/api/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = async () => {
  return api.post('/api/notifications/read-all');
};

// Team Leave Calendar
export const getTeamLeaves = async (year, month) => {
  return api.get(`/api/leaves/team?year=${year}&month=${month}`);
};

// User Profile
export const updateEmployeeProfile = async (id, profileData) => {
  return api.put(`/api/employees/${id}/profile`, profileData);
};
