import AppDataSource from '../data-source';
import { LeaveRequest } from '../entities/LeaveRequest';
import { Employee } from '../entities/Employee';
import { MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

// Define valid leave types
const leaveEntitlements: Record<
  | 'Annual Leave'
  | 'Sick Leave'
  | 'Personal Leave'
  | 'Maternity Leave'
  | 'Paternity Leave'
  | 'Emergency Leave'
  | 'Other',
  number
> = {
  'Annual Leave': 20,
  'Sick Leave': 10,
  'Personal Leave': 5,
  'Maternity Leave': 90,
  'Paternity Leave': 15,
  'Emergency Leave': 3,
  Other: 0, // Case-by-case
};

type LeaveTypeKey = keyof typeof leaveEntitlements;

// Function to calculate working days (excluding weekends)
export const calculateWorkingDays = (startDate: Date, endDate: Date): number => {
  let workingDays = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Count only Monday to Friday (1-5)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workingDays;
};

// Function to check if a date is a weekend
export const isWeekend = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
};

// Function to get weekend dates in a range
export const getWeekendsInRange = (startDate: Date, endDate: Date): Date[] => {
  const weekends: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (isWeekend(currentDate)) {
      weekends.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return weekends;
};

// Function to validate and calculate leave request details
export const validateLeaveRequest = (startDate: Date, endDate: Date) => {
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
  const workingDays = calculateWorkingDays(startDate, endDate);
  const weekendDays = totalDays - workingDays;
  const weekends = getWeekendsInRange(startDate, endDate);
  
  return {
    totalDays,
    workingDays,
    weekendDays,
    weekends: weekends.map(date => date.toISOString().split('T')[0]),
    message: weekendDays > 0 
      ? `Your leave request spans ${totalDays} days total, but only ${workingDays} working days will be deducted from your leave balance. ${weekendDays} weekend days are excluded.`
      : `Your leave request spans ${workingDays} working days.`
  };
};

export const calculateLeaveBalance = async (employeeId: number) => {
  console.log(`Calculating leave balance for employee ID: ${employeeId}`);
  
  const employeeRepo = AppDataSource.getRepository(Employee);
  const employee = await employeeRepo.findOne({ where: { id: employeeId } });

  if (!employee) {
    throw new Error('Employee not found');
  }

  console.log(`Found employee: ${employee.name} (ID: ${employee.id})`);

  const leaveRepo = AppDataSource.getRepository(LeaveRequest);
  const approvedLeaves = await leaveRepo.find({
    where: { employee: { id: employeeId }, status: 'Approved' },
    relations: ['leaveType'],
  });
  
  console.log(`Found ${approvedLeaves.length} approved leave requests with leaveType relation`);

  console.log(`Found ${approvedLeaves.length} approved leave requests for employee ${employeeId}`);
  
  // Let's also check all leave requests (not just approved) for debugging
  const allLeaves = await leaveRepo.find({
    where: { employee: { id: employeeId } },
    relations: ['leaveType'],
  });
  
  console.log(`Total leave requests for employee ${employeeId}: ${allLeaves.length}`);
  allLeaves.forEach((leave, index) => {
    console.log(`  ${index + 1}. ${leave.leaveType?.name || 'No Type'} - ${leave.startDate} to ${leave.endDate} - Status: ${leave.status}`);
  });

  const leaveTaken: Record<LeaveTypeKey, number> = {
    'Annual Leave': 0,
    'Sick Leave': 0,
    'Personal Leave': 0,
    'Maternity Leave': 0,
    'Paternity Leave': 0,
    'Emergency Leave': 0,
    Other: 0,
  };

  approvedLeaves.forEach((leave) => {
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    
    // Calculate working days (excluding weekends)
    const workingDays = calculateWorkingDays(startDate, endDate);
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
    const weekendDays = totalDays - workingDays;

    const typeName = leave.leaveType?.name as LeaveTypeKey | undefined;
    
    console.log(`Processing leave: ${typeName || 'No Type'} - ${workingDays} working days (${totalDays} total days, ${weekendDays} weekend days excluded) (${startDate.toDateString()} to ${endDate.toDateString()})`);

    if (typeName && typeName in leaveTaken) {
      leaveTaken[typeName] += workingDays;
      console.log(`Added ${workingDays} working days to ${typeName}. Total now: ${leaveTaken[typeName]}`);
    } else {
      leaveTaken.Other += workingDays;
      console.log(`Unknown leave type '${typeName}', added ${workingDays} working days to 'Other'. Total Other: ${leaveTaken.Other}`);
    }
  });

  const balances: Record<
    LeaveTypeKey,
    | { entitlement: number; taken: number; remaining: number }
    | { entitlement: string; taken: number; remaining: string }
  > = {} as any;

  let totalTaken = 0;
  let totalEntitlement = 0;

  (Object.keys(leaveEntitlements) as LeaveTypeKey[]).forEach((leaveType) => {
    const entitlement = leaveEntitlements[leaveType];
    const taken = leaveTaken[leaveType];

    if (leaveType === 'Other') {
      balances[leaveType] = {
        entitlement: 'Case by case',
        taken,
        remaining: 'N/A',
      };
    } else {
      balances[leaveType] = {
        entitlement,
        taken,
        remaining: Math.max(0, entitlement - taken),
      };
      totalEntitlement += entitlement;
    }
    totalTaken += taken;
  });

  console.log(`Final leave balance calculation:`);
  console.log(`Total taken: ${totalTaken} days`);
  console.log(`Total entitlement: ${totalEntitlement} days`);
  Object.keys(balances).forEach(leaveType => {
    const balance = balances[leaveType as LeaveTypeKey];
    console.log(`   ${leaveType}: ${balance.taken} taken, ${balance.remaining} remaining (out of ${balance.entitlement})`);
  });
  try {
    employee.annualLeaveBalance = (balances['Annual Leave'] as any).remaining;
    employee.sickLeaveBalance = (balances['Sick Leave'] as any).remaining;
    employee.personalLeaveBalance = (balances['Personal Leave'] as any).remaining;
    
    await employeeRepo.save(employee);
    console.log(`Updated leave balances for employee ${employeeId}:`, {
      annual: employee.annualLeaveBalance,
      sick: employee.sickLeaveBalance,
      personal: employee.personalLeaveBalance
    });
  } catch (error) {
    console.error('Error updating employee leave balances:', error);
  }
  
  return {
    balances,
    totalTaken,
    totalEntitlement,
    annual: (balances['Annual Leave'] as any).remaining,
    sick: (balances['Sick Leave'] as any).remaining,
    personal: (balances['Personal Leave'] as any).remaining,
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
    const leaveDays =
      Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
    totalLeaveDaysTaken += leaveDays;
  });

  const totalLeaveEntitlement = 30;
  const unusedLeaveDays = totalLeaveEntitlement - totalLeaveDaysTaken;

  return unusedLeaveDays > 0 ? unusedLeaveDays : 0;
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
