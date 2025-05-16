import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getTeamLeaves, getEmployees } from '../api/api';

const LeaveCalendar = () => {
  const { authData } = useContext(AuthContext);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  
  useEffect(() => {
    if (authData?.token) {
      fetchTeamLeaves();
      fetchEmployees();
    }
  }, [authData, currentMonth]);
  
  const fetchTeamLeaves = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from the API with the month as a parameter
      // const response = await getTeamLeaves(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
      // setTeamLeaves(response.data);
      
      // Mock data for now - generate some random leaves for the current month
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const mockEmployees = [
        'John Doe', 'Jane Smith', 'Michael Johnson', 'Emily Davis', 
        'Robert Wilson', 'Sarah Brown', 'David Miller', 'Lisa Taylor'
      ];
      
      const leaveTypes = ['Annual Leave', 'Sick Leave', 'Personal Leave'];
      
      const mockLeaves = [];
      
      // Generate 10-15 random leaves
      const leaveCount = 10 + Math.floor(Math.random() * 6);
      
      for (let i = 1; i <= leaveCount; i++) {
        const employeeName = mockEmployees[Math.floor(Math.random() * mockEmployees.length)];
        const leaveType = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];
        
        // Random start day between 1 and daysInMonth - 5
        const startDay = 1 + Math.floor(Math.random() * (daysInMonth - 5));
        
        // Random duration between 1 and 5 days
        const duration = 1 + Math.floor(Math.random() * 5);
        const endDay = Math.min(startDay + duration - 1, daysInMonth);
        
        mockLeaves.push({
          id: i,
          employeeName,
          startDate: formatDate(year, month, startDay),
          endDate: formatDate(year, month, endDay),
          leaveType
        });
      }
      
      setTeamLeaves(mockLeaves);
      setError('');
    } catch (error) {
      console.error('Error fetching team leaves:', error);
      setError('Failed to load team leave data');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchEmployees = async () => {
    try {
      // In a real app, this would fetch from the API
      // const response = await getEmployees();
      // setEmployees(response.data);
      
      // Mock data for now
      setEmployees([
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' },
        { id: 3, name: 'Michael Johnson' },
        { id: 4, name: 'Emily Davis' },
        { id: 5, name: 'Robert Wilson' },
        { id: 6, name: 'Sarah Brown' },
        { id: 7, name: 'David Miller' },
        { id: 8, name: 'Lisa Taylor' }
      ]);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Get days in month
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Get day of week for first day of month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Format date as YYYY-MM-DD
  const formatDate = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Check if a date has any leaves
  const getLeavesForDate = (year, month, day) => {
    const dateStr = formatDate(year, month, day);
    return teamLeaves.filter(leave => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const current = new Date(dateStr);
      return current >= start && current <= end && 
        (selectedEmployee === 'all' || leave.employeeName === selectedEmployee);
    });
  };

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Get month name
  const monthName = currentMonth.toLocaleString('default', { month: 'long' });
  
  // Get year
  const year = currentMonth.getFullYear();
  
  // Get days in current month
  const daysInMonth = getDaysInMonth(currentMonth);
  
  // Get first day of month
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth);

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-24 border border-gray-200 bg-gray-50"></div>);
  }
  
  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(year, currentMonth.getMonth(), day);
    const leavesForDay = getLeavesForDate(year, currentMonth.getMonth(), day);
    const isToday = new Date().toDateString() === new Date(dateStr).toDateString();
    
    calendarDays.push(
      <div 
        key={day} 
        className={`h-24 border border-gray-200 p-1 overflow-y-auto ${isToday ? 'bg-blue-50' : ''}`}
      >
        <div className="font-semibold text-sm mb-1">{day}</div>
        {leavesForDay.map(leave => (
          <div 
            key={`${day}-${leave.id}`} 
            className={`text-xs p-1 mb-1 rounded truncate ${
              leave.leaveType === 'Annual Leave' ? 'bg-green-100 text-green-800' :
              leave.leaveType === 'Sick Leave' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}
            title={`${leave.employeeName} - ${leave.leaveType}`}
          >
            {leave.employeeName}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Team Leave Calendar</h2>
        <div className="flex space-x-2">
          <button 
            onClick={prevMonth}
            className="bg-gray-200 hover:bg-gray-300 rounded p-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-lg font-medium">
            {monthName} {year}
          </div>
          <button 
            onClick={nextMonth}
            className="bg-gray-200 hover:bg-gray-300 rounded p-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Employee Filter */}
      <div className="mb-4">
        <label htmlFor="employee-filter" className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Employee
        </label>
        <select
          id="employee-filter"
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="all">All Employees</option>
          {employees.map(employee => (
            <option key={employee.id} value={employee.name}>
              {employee.name}
            </option>
          ))}
        </select>
      </div>
      
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center h-60">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-px">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold p-2 bg-gray-100">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays}
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
              <span className="text-sm">Annual Leave</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-100 rounded mr-2"></div>
              <span className="text-sm">Sick Leave</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-100 rounded mr-2"></div>
              <span className="text-sm">Personal Leave</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LeaveCalendar;