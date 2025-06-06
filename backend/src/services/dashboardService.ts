// services/dashboardService.ts
import { LeaveRequest } from '../entities/LeaveRequest';
import { Employee } from '../entities/Employee';
import AppDataSource from '../data-source';
import { In } from 'typeorm';
import { calculateLeaveBalance } from './leaveServices';

// 1. Employee dashboard
export const getEmployeeDashboardData = async (userId: number) => {
  try {
    console.log(`Fetching dashboard data for employee ${userId}`);
    const leaveRepo = AppDataSource.getRepository(LeaveRequest);
    const leaveRequests = await leaveRepo.find({
      where: { 
        employee: { id: userId } 
      },
      relations: ['employee', 'employee.department', 'approvals', 'approvals.approver', 'leaveType'],
      order: { 
        createdAt: 'DESC' 
      }
    });
    
    console.log(`Found ${leaveRequests.length} leave requests for employee ${userId}`);
    return leaveRequests;
  } catch (error) {
    console.error(`Error fetching employee dashboard data:`, error);
    throw error; 
  }
};

// 2. Manager dashboard
export const getManagerDashboardData = async (managerId: number) => {
  try {
    console.log(`Fetching dashboard data for manager ${managerId}`);
    const leaveRepo = AppDataSource.getRepository(LeaveRequest);
    const employeeRepo = AppDataSource.getRepository(Employee);
    
    
    let pendingRequests: LeaveRequest[] = [];
    try {
      
      const teamMembers = await employeeRepo.find({
        where: { manager: { id: managerId } },
        select: ['id']
      });
      
      
      const teamMemberIds = teamMembers.map(member => member.id);
      pendingRequests = await leaveRepo.find({
        where: { 
          status: 'Pending',
          employee: { 
            id: In(teamMemberIds) 
          }
        },
        relations: ['employee', 'employee.department', 'approvals', 'approvals.approver', 'leaveType'],
        order: { createdAt: 'DESC' },
      });
      console.log(`Found ${pendingRequests.length} pending requests for manager ${managerId}'s team`);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
    let teamMembers: Employee[] = [];
    try {
      teamMembers = await employeeRepo.find({
        where: { manager: { id: managerId } },
        relations: ['manager', 'department'],
      });
      console.log(`Found ${teamMembers.length} team members managed by manager ${managerId}`);
      for (const employee of teamMembers) {
        try {
          const leaveBalance = await calculateLeaveBalance(employee.id);
          employee.annualLeaveBalance = leaveBalance.annual;
          employee.sickLeaveBalance = leaveBalance.sick;
          employee.personalLeaveBalance = leaveBalance.personal;
        } catch (error) {
          console.error(`Error calculating leave balance for employee ${employee.id}:`, error);
          employee.annualLeaveBalance = employee.annualLeaveBalance || 20;
          employee.sickLeaveBalance = employee.sickLeaveBalance || 10;
          employee.personalLeaveBalance = employee.personalLeaveBalance || 5;
        }
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
    let approvedCount = 0;
    try {
      approvedCount = await leaveRepo.count({
        where: { status: 'Approved' }
      });
      console.log(`Found ${approvedCount} approved requests`);
    } catch (error) {
      console.error('Error counting approved requests:', error);
    }
    
    return {
      pendingRequests,
      teamMembers,
      approvedThisMonth: approvedCount
    };
  } catch (error) {
    console.error('Error in manager dashboard:', error);
    return {
      pendingRequests: [],
      teamMembers: [],
      approvedThisMonth: 0
    };
  }
};

// 3. HR dashboard
export const getHRDashboardData = async () => {
  try {
    console.log('Fetching HR dashboard data');
    const leaveRepo = AppDataSource.getRepository(LeaveRequest);
    const employeeRepo = AppDataSource.getRepository(Employee);
    let allRequests: LeaveRequest[] = [];
    try {
      allRequests = await leaveRepo.find({
        relations: ['employee', 'employee.department', 'approvals', 'approvals.approver', 'leaveType'],
        order: { createdAt: 'DESC' },
      });
      console.log(`Found ${allRequests.length} leave requests`);
    } catch (error) {
      console.error('Error fetching all requests:', error);
    }
    let allEmployees: Employee[] = [];
    try {
      allEmployees = await employeeRepo.find({
        relations: ['department', 'manager']
      });
      console.log(`Found ${allEmployees.length} employees`);
      
      // Calculate actual leave balances for each employee
      for (const employee of allEmployees) {
        try {
          const leaveBalance = await calculateLeaveBalance(employee.id);
          employee.annualLeaveBalance = leaveBalance.annual;
          employee.sickLeaveBalance = leaveBalance.sick;
          employee.personalLeaveBalance = leaveBalance.personal;
        } catch (error) {
          console.error(`Error calculating leave balance for employee ${employee.id}:`, error);
          employee.annualLeaveBalance = employee.annualLeaveBalance || 20;
          employee.sickLeaveBalance = employee.sickLeaveBalance || 10;
          employee.personalLeaveBalance = employee.personalLeaveBalance || 5;
        }
      }
    } catch (error) {
      console.error('Error fetching all employees:', error);
    }
    
    // Get pending requests
    let pendingRequests: LeaveRequest[] = [];
    try {
      pendingRequests = await leaveRepo.find({
        where: [
          { status: 'Pending' },
          { status: 'Manager Approved' }
        ],
        relations: ['employee', 'employee.department', 'approvals', 'approvals.approver', 'leaveType'],
        order: { createdAt: 'DESC' },
      });
      const managerRequests = await leaveRepo.find({
        where: {
          status: 'Pending',
          employee: {
            role: 'Manager'
          }
        },
        relations: ['employee', 'employee.department', 'approvals', 'approvals.approver', 'leaveType'],
      });
      const existingIds = new Set(pendingRequests.map(req => req.id));
      for (const req of managerRequests) {
        if (!existingIds.has(req.id)) {
          pendingRequests.push(req);
        }
      }
      console.log(`Found ${pendingRequests.length} pending requests`);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
    let approvedCount = 0;
    try {
      approvedCount = await leaveRepo.count({
        where: { status: 'Approved' }
      });
      console.log(`Found ${approvedCount} approved requests`);
    } catch (error) {
      console.error('Error counting approved requests:', error);
    }
    
    return {
      allRequests,
      allEmployees,
      pendingRequests,
      approvedThisMonth: approvedCount
    };
  } catch (error) {
    console.error('Error in HR dashboard:', error);
    return {
      allRequests: [],
      allEmployees: [],
      pendingRequests: [],
      approvedThisMonth: 0
    };
  }
};