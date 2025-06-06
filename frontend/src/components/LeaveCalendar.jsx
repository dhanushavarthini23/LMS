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
      console.log(`Fetching team leaves for year: ${currentMonth.getFullYear()}, month: ${currentMonth.getMonth() + 1}`);
      
      // Fetch data from the API
      const response = await getTeamLeaves(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
      console.log('API response:', response);
      
      // If there's an error in the response, handle it
      if (response.data && response.data.error) {
        throw new Error(response.data.error);
      }
      
      if (response && response.data && Array.isArray(response.data)) {
        console.log('Team leaves data:', response.data);
        
        // Process the data
        const formattedLeaves = response.data.map(leave => {
          // Safely parse dates
          let startDate, endDate;
          
          try {
            startDate = new Date(leave.startDate);
            endDate = new Date(leave.endDate);
            
            // Check if dates are valid
            if (isNaN(startDate.getTime())) {
              console.warn(`Invalid startDate for leave ${leave.id}: ${leave.startDate}`);
              startDate = new Date(); // Fallback to current date
            }
            
            if (isNaN(endDate.getTime())) {
              console.warn(`Invalid endDate for leave ${leave.id}: ${leave.endDate}`);
              endDate = new Date(); // Fallback to current date
            }
          } catch (error) {
            console.error(`Error parsing dates for leave ${leave.id}:`, error);
            startDate = new Date();
            endDate = new Date();
          }
          
          return {
            id: leave.id,
            employeeName: leave.employeeName || 'Unknown',
            startDate: startDate,
            endDate: endDate,
            leaveType: leave.leaveType || 'Annual Leave'
          };
        });
        
        console.log('Formatted leaves:', formattedLeaves);
        setTeamLeaves(formattedLeaves);
        setError('');
      } else {
        // If no data, show empty state
        setTeamLeaves([]);
        setError('No leave data available for this month.');
      }
    } catch (error) {
      console.error('Error fetching team leaves:', error);
      setTeamLeaves([]);
      setError('Unable to fetch leave data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  

  
  const fetchEmployees = async () => {
    try {
      const response = await getEmployees();
      if (response && response.data && Array.isArray(response.data)) {
        setEmployees(response.data);
      } else {
        setEmployees([]);
        console.error('No employee data returned from API');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  
  const getLeavesForDate = (year, month, day) => {
    
    const currentDate = new Date(year, month, day);
    const currentDateTimestamp = currentDate.getTime();
    
    return teamLeaves.filter(leave => {
      try {
        
        const startDate = leave.startDate;
        const endDate = leave.endDate;
        
        if (!startDate || !endDate) {
          console.warn('Missing date in leave record:', leave);
          return false;
        }
        
        // Create date objects without time component for comparison
        const startDateNoTime = new Date(
          startDate.getFullYear(), 
          startDate.getMonth(), 
          startDate.getDate()
        );
        
        const endDateNoTime = new Date(
          endDate.getFullYear(), 
          endDate.getMonth(), 
          endDate.getDate()
        );
        
        // Simple date comparison (ignoring time)
        const isWithinLeavePeriod = 
          currentDateTimestamp >= startDateNoTime.getTime() && 
          currentDateTimestamp <= endDateNoTime.getTime();
        
        // Check if the employee matches the selected filter
        const isEmployeeMatch = selectedEmployee === 'all' || leave.employeeName === selectedEmployee;
        
        return isWithinLeavePeriod && isEmployeeMatch;
      } catch (error) {
        console.error('Error processing leave dates:', error);
        return false;
      }
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
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-24 border border-gray-200 bg-gray-50"></div>);
  }
  
  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(year, currentMonth.getMonth(), day);
    const leavesForDay = getLeavesForDate(year, currentMonth.getMonth(), day);
    const currentDate = new Date(year, currentMonth.getMonth(), day);
    const isToday = new Date().toDateString() === currentDate.toDateString();
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6; // Sunday or Saturday
    
    let dayClass = 'h-24 border border-gray-200 p-1 overflow-y-auto';
    
    if (isToday) {
      dayClass += ' bg-blue-50 border-blue-300';
    } else if (isWeekend) {
      dayClass += ' bg-pink-50 border-pink-200';
    }
    
    calendarDays.push(
      <div 
        key={day} 
        className={dayClass}
      >
        <div className={`font-semibold text-sm mb-1 flex items-center justify-between ${isWeekend ? 'text-red-600' : ''}`}>
          <span>{day}</span>
          {isWeekend && (
            <span className="text-xs bg-pink-100 text-pink-600 px-1 rounded">
              {currentDate.getDay() === 0 ? 'SUN' : 'SAT'}
            </span>
          )}
        </div>
        {isWeekend && (
          <div className="text-xs text-pink-500 mb-1 font-medium">Weekend</div>
        )}
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
        {leavesForDay.length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            {leavesForDay.length} {leavesForDay.length === 1 ? 'person' : 'people'} on leave
          </div>
        )}
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
          {employees && employees.length > 0 ? (
            employees.map(employee => (
              <option key={employee.id} value={employee.name || employee.fullName || `${employee.firstName} ${employee.lastName}`}>
                {employee.name || employee.fullName || `${employee.firstName} ${employee.lastName}`}
              </option>
            ))
          ) : (
            <option disabled>No employees available</option>
          )}
        </select>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-60">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 text-center">
              {error}
            </div>
          )}
          
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
          
          {teamLeaves.length === 0 && !loading && !error && (
            <div className="text-center py-6 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2">No leave requests found for this month.</p>
            </div>
          )}
          
          {/* Legend */}
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Legend:</h4>
            <div className="flex flex-wrap gap-4">
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
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-50 border border-red-200 rounded mr-2"></div>
                <span className="text-sm">Weekends (Sat/Sun)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded mr-2"></div>
                <span className="text-sm">Today</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              💡 Weekends are automatically excluded from leave calculations
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LeaveCalendar;