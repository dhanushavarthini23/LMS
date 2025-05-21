// services/dashboardService.ts
import { LeaveRequest } from '../entities/LeaveRequest';
import { Employee } from '../entities/Employee';
import AppDataSource from '../data-source';
import { In } from 'typeorm';

// 1. Employee dashboard
export const getEmployeeDashboardData = async (userId: number) => {
  try {
    console.log(`Fetching dashboard data for employee ${userId}`);
    const leaveRepo = AppDataSource.getRepository(LeaveRequest);
    
    // Get leave requests for this employee
    const leaveRequests = await leaveRepo.find({
      where: { 
        employee: { id: userId } 
      },
      relations: ['employee', 'approvals', 'approvals.approver'],
      order: { 
        createdAt: 'DESC' 
      }
    });
    
    console.log(`Found ${leaveRequests.length} leave requests for employee ${userId}`);
    return leaveRequests;
  } catch (error) {
    console.error(`Error fetching employee dashboard data:`, error);
    throw error; // Let the route handler deal with the error
  }
};

// 2. Manager dashboard
export const getManagerDashboardData = async (managerId: number) => {
  try {
    console.log(`Fetching dashboard data for manager ${managerId}`);
    const leaveRepo = AppDataSource.getRepository(LeaveRequest);
    const employeeRepo = AppDataSource.getRepository(Employee);
    
    // Get pending leave requests for the manager's team
    let pendingRequests: LeaveRequest[] = [];
    try {
      // First, get all employees managed by this manager
      const teamMembers = await employeeRepo.find({
        where: { manager: { id: managerId } },
        select: ['id']
      });
      
      // Get the IDs of team members
      const teamMemberIds = teamMembers.map(member => member.id);
      
      // Only fetch leave requests for team members, not the manager's own requests
      pendingRequests = await leaveRepo.find({
        where: { 
          status: 'Pending',
          employee: { 
            id: In(teamMemberIds) 
          }
        },
        relations: ['employee', 'approvals', 'approvals.approver'],
        order: { createdAt: 'DESC' },
      });
      console.log(`Found ${pendingRequests.length} pending requests for manager ${managerId}'s team`);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
    
    // Get team members
    let teamMembers: Employee[] = [];
    try {
      // Get team members managed by this manager
      teamMembers = await employeeRepo.find({
        where: { manager: { id: managerId } },
        relations: ['manager'],
      });
      console.log(`Found ${teamMembers.length} team members managed by manager ${managerId}`);
      
      // Only set default leave balance if it's not already set
      teamMembers.forEach(employee => {
        if (employee.leaveBalance === undefined || employee.leaveBalance === null) {
          employee.leaveBalance = 20; // Default value
        }
      });
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
    
    // Count approved requests
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
    
    // Get all leave requests
    let allRequests: LeaveRequest[] = [];
    try {
      allRequests = await leaveRepo.find({
        relations: ['employee', 'approvals', 'approvals.approver'],
        order: { createdAt: 'DESC' },
      });
      console.log(`Found ${allRequests.length} leave requests`);
    } catch (error) {
      console.error('Error fetching all requests:', error);
    }
    
    // Get all employees
    let allEmployees: Employee[] = [];
    try {
      allEmployees = await employeeRepo.find();
      console.log(`Found ${allEmployees.length} employees`);
      
      // Only set default leave balance if it's not already set
      allEmployees.forEach(employee => {
        if (employee.leaveBalance === undefined || employee.leaveBalance === null) {
          employee.leaveBalance = 20; // Default value
        }
      });
    } catch (error) {
      console.error('Error fetching all employees:', error);
    }
    
    // Get pending requests
    let pendingRequests: LeaveRequest[] = [];
    try {
      // Get all pending requests and manager-approved requests
      // Also get requests from managers that are still pending
      pendingRequests = await leaveRepo.find({
        where: [
          { status: 'Pending' },
          { status: 'Manager Approved' }
        ],
        relations: ['employee', 'approvals', 'approvals.approver'],
        order: { createdAt: 'DESC' },
      });
      
      // Make sure we include pending requests from managers
      const managerRequests = await leaveRepo.find({
        where: {
          status: 'Pending',
          employee: {
            role: 'Manager'
          }
        },
        relations: ['employee', 'approvals', 'approvals.approver'],
      });
      
      // Add manager requests to pending requests (avoiding duplicates)
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
    
    // Count approved requests
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