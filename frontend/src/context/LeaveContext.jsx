import React, { createContext, useState, useEffect } from 'react';
import { getLeaveRequests } from '../api/api';

export const LeaveContext = createContext();

export const LeaveProvider = ({ children }) => {
  const [leaveRequests, setLeaveRequests] = useState([]);

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        const response = await getLeaveRequests(token);
        setLeaveRequests(response.data);
      } catch (error) {
        console.error('Error fetching leave requests', error);
      }
    };

    fetchLeaveRequests();
  }, []);

  return (
    <LeaveContext.Provider value={{ leaveRequests }}>
      {children}
    </LeaveContext.Provider>
  );
};
