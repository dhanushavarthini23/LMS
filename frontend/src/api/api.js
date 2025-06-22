import axios from 'axios';

const API_URL = 'http://localhost:5000'; 
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
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
export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }

    return response;
  } catch (error) {
    throw error.response ? error.response.data : 'Login failed';
  }
};

// Leave Requests
export const getLeaveRequests = async () => {
  return api.get('/api/leave-requests');
};

export const createLeaveRequest = async (data) => {
  return api.post('/api/leave-requests', data);
};

export const cancelLeaveRequest = async (leaveId) => {
  return api.delete(`/api/leave-requests/${leaveId}`);
};

export const getLeaveHistory = async () => {
  return api.get('/api/leave-history');
};

export const getLeaveBalance = async (employeeId) => {
  if (employeeId) {
    return api.get(`/api/leave-balance/${employeeId}`);
  }
  return api.get('/api/leave-balance');
};

// For managers and HR
export const getPendingLeaveRequests = async () => {
  return api.get('/api/leave-requests/pending');
};
export const getEmployeeLeaveBalances = async () => {
  return api.get('/api/employees/leave-balances');
};

// Validate leave request dates
export const validateLeaveRequest = async (startDate, endDate) => {
  return api.post('/api/leaves/validate', { startDate, endDate });
};
export const getAllLeaveRequests = async () => {
  return api.get('/api/leave-requests/all');
};

export const approveLeaveRequestManager = async (leaveId, isApproved, comment = '') => {
  const payload = {
    decision: isApproved ? 'approve' : 'reject'
  };
  
  // Only include comment if it's not empty
  if (comment && comment.trim()) {
    payload.comment = comment.trim();
  }
  

  return api.post(`/api/leave-requests/${leaveId}/approve/manager`, payload);
};

export const approveLeaveRequestHR = async (leaveId, isApproved, comment = '') => {
  const payload = {
    decision: isApproved ? 'approve' : 'reject'
  };
  
  // Only include comment if it's not empty
  if (comment && comment.trim()) {
    payload.comment = comment.trim();
  }
  
  return api.post(`/api/leave-requests/${leaveId}/approve/hr`, payload);
};

// Dashboard
export const getDashboardData = async () => {
  return api.get('/api/dashboard');
};

// Employee Management
export const getEmployees = async () => {
  return api.get('/api/employees');
};

export const getEmployeeProfile = async () => {
return api.get('/api/employees/profile');
 };

export const createEmployee = async (employeeData) => {
  return api.post('/api/employees', employeeData);
};

export const updateEmployeeStatus = async (employeeId, isActive) => {
  return api.put(`/api/employees/${employeeId}/status`, { isActive });
};

export const getSystemStats = async () => {
  return api.get('/api/admin/stats');
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
  return api.get(`/api/leaves/team`, {
    params: { year, month }
  });
};

// User Profile
export const updateEmployeeProfile = async (profileData) => {
  return api.put('/api/employees/profile', profileData);
};

// Leave Types
export const getLeaveTypes = async () => {
  return api.get('/api/leave-types');
};

export const getLeaveType = async (id) => {
  return api.get(`/api/leave-types/${id}`);
};

export const createLeaveType = async (leaveTypeData) => {
  return api.post('/api/leave-types', leaveTypeData);
};

export const updateLeaveType = async (id, leaveTypeData) => {
  return api.put(`/api/leave-types/${id}`, leaveTypeData);
};

// Departments
export const getDepartments = async () => {
  return api.get('/api/departments');
};

export const getDepartment = async (id) => {
  return api.get(`/api/departments/${id}`);
};

export const createDepartment = async (departmentData) => {
  return api.post('/api/departments', departmentData);
};

export const updateDepartment = async (id, departmentData) => {
  return api.put(`/api/departments/${id}`, departmentData);
};
