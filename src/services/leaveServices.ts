import AppDataSource from '../data-source'; // Make sure to import your DataSource instance
import { LeaveRequest } from '../entities/LeaveRequest';
import { Employee } from '../entities/Employee';
import { MoreThanOrEqual, LessThanOrEqual } from 'typeorm'; // Importing necessary operators

// Function to calculate leave balance for an employee
export const calculateLeaveBalance = async (employeeId: number) => {
  // Get employee repository
  const employeeRepo = AppDataSource.getRepository(Employee); // Updated to use DataSource.getRepository
  const employee = await employeeRepo.findOne({ where: { id: employeeId } });

  if (!employee) {
    throw new Error('Employee not found');
  }

  // Fetch the leave requests for the employee with "Approved" status
  const leaveRepo = AppDataSource.getRepository(LeaveRequest); // Updated to use DataSource.getRepository
  const approvedLeaves = await leaveRepo.find({
    where: { employee: { id: employeeId }, status: 'Approved' },
  });

  // Calculate total leave days taken
  let totalLeaveDaysTaken = 0;
  approvedLeaves.forEach((leave) => {
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    // Add 1 to include both start and end dates
    const leaveDays = ((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1; 
    totalLeaveDaysTaken += leaveDays;
  });

  // Return a structured leave balance object
  return {
    annual: 20,
    sick: 10,
    personal: 5
  };
};


export const carryForwardLeave = async (employeeId: number, year: number) => {
  
  const employeeRepo = AppDataSource.getRepository(Employee); 
  const leaveRepo = AppDataSource.getRepository(LeaveRequest); 

  const employee = await employeeRepo.findOne({ where: { id: employeeId } });

  if (!employee) {
    throw new Error('Employee not found');
  }


  const startOfYear = new Date(`${year}-01-01`);
  const endOfYear = new Date(`${year}-12-31`);

  
  const leavesForYear = await leaveRepo.find({
    where: {
      employee: { id: employeeId },
      startDate: MoreThanOrEqual(startOfYear),  
      endDate: LessThanOrEqual(endOfYear),     
      status: 'Approved',
    },
  });

  
  let totalLeaveDaysTaken = 0;
  leavesForYear.forEach((leave) => {
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
   
    const leaveDays = ((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
    totalLeaveDaysTaken += leaveDays;
  });

  
  const totalLeaveEntitlement = 30; 

  
  const unusedLeaveDays = totalLeaveEntitlement - totalLeaveDaysTaken;

  if (unusedLeaveDays > 0) {
    return unusedLeaveDays;
  } else {
    return 0;
  }
};


export const getLeaveHistory = async (employeeId: number) => {
  const leaveRepo = AppDataSource.getRepository(LeaveRequest); 
  
  const leaveHistory = await leaveRepo.find({
    where: { employee: { id: employeeId }, status: 'Approved' },
    relations: ['employee', 'approvals'],
    order: { createdAt: 'DESC' }, 
  });

  return leaveHistory;
};
