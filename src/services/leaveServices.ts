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
    const leaveDays = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24); // Convert to days
    totalLeaveDaysTaken += leaveDays;
  });

  // Define the total leave entitlement (e.g., 20 days per year)
  const totalLeaveEntitlement = 20; // You can adjust this or fetch from employee data

  // Calculate and return the leave balance
  const leaveBalance = totalLeaveEntitlement - totalLeaveDaysTaken;
  return leaveBalance;
};

// Function to carry forward unused leave
export const carryForwardLeave = async (employeeId: number, year: number) => {
  // Get employee and leave request repository
  const employeeRepo = AppDataSource.getRepository(Employee); // Updated to use DataSource.getRepository
  const leaveRepo = AppDataSource.getRepository(LeaveRequest); // Updated to use DataSource.getRepository

  const employee = await employeeRepo.findOne({ where: { id: employeeId } });

  if (!employee) {
    throw new Error('Employee not found');
  }

  // Define the start and end of the year
  const startOfYear = new Date(`${year}-01-01`);
  const endOfYear = new Date(`${year}-12-31`);

  // Get the approved leaves for this employee within the specified year
  const leavesForYear = await leaveRepo.find({
    where: {
      employee: { id: employeeId },
      startDate: MoreThanOrEqual(startOfYear),  // Use MoreThanOrEqual for startDate comparison
      endDate: LessThanOrEqual(endOfYear),     // Use LessThanOrEqual for endDate comparison
      status: 'Approved',
    },
  });

  // Calculate total unused leave for the given year
  let totalLeaveDaysTaken = 0;
  leavesForYear.forEach((leave) => {
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    const leaveDays = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24); // Convert to days
    totalLeaveDaysTaken += leaveDays;
  });

  // Define the total leave entitlement for the year (e.g., 20 days)
  const totalLeaveEntitlement = 20; // You can adjust this as needed

  // Calculate unused leave days
  const unusedLeaveDays = totalLeaveEntitlement - totalLeaveDaysTaken;

  if (unusedLeaveDays > 0) {
    return unusedLeaveDays;
  } else {
    return 0;
  }
};

// Function to get leave history for an employee
export const getLeaveHistory = async (employeeId: number) => {
  const leaveRepo = AppDataSource.getRepository(LeaveRequest); // Updated to use DataSource.getRepository
  
  const leaveHistory = await leaveRepo.find({
    where: { employee: { id: employeeId }, status: 'Approved' },
    relations: ['employee', 'approvals'],
    order: { createdAt: 'DESC' }, // Most recent first
  });

  return leaveHistory;
};
