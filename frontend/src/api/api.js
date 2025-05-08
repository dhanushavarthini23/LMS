import axios from 'axios';

const API_URL = 'http://localhost:5000'; // Backend URL

export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    return response;
  } catch (error) {
    throw error.response ? error.response.data : 'Login failed';
  }
};

export const getLeaveRequests = async (token) => {
  return axios.get(`${API_URL}/leave/requests`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const createLeaveRequest = async (data, token) => {
  return axios.post(`${API_URL}/leave`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
