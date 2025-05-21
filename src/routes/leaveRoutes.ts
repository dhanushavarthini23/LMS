import { ServerRoute } from '@hapi/hapi';
import AppDataSource from '../data-source';
import { LeaveRequest } from '../entities/LeaveRequest';
import { ApprovalController } from '../controllers/ApprovalController';
import { isAuthenticated, isManager, isHR } from '../middlewares/authorization';
import { calculateLeaveBalance, carryForwardLeave } from '../services/leaveServices';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

const leaveRoutes: ServerRoute[] = [
  // Get team leaves for calendar
  {
    method: 'GET',
    path: '/api/leaves/team',
    options: {
      auth: false // Consider enabling auth in production
    },
    handler: async (request, h) => {
      try {
        // Get year and month from query parameters, or use current date if not provided
        const query = request.query as any;
        const now = new Date();
        const year = query.year ? parseInt(query.year) : now.getFullYear();
        const month = query.month ? parseInt(query.month) : now.getMonth() + 1; // JavaScript months are 0-indexed
        
        // Create date range for the specified month
        const startDate = new Date(year, month - 1, 1); // Month is 0-indexed in Date constructor
        const endDate = new Date(year, month, 0); // Last day of the month
        
        // Get leave requests repository
        const leaveRepo = (request.server.app as any).dataSource.getRepository(LeaveRequest);
        
        // Fetch approved leave requests that overlap with the specified month
        const leaveRequests = await leaveRepo.find({
          where: [
            {
              status: 'Approved',
              startDate: Between(startDate, endDate)
            },
            {
              status: 'Approved',
              endDate: Between(startDate, endDate)
            },
            {
              status: 'Approved',
              startDate: LessThanOrEqual(startDate),
              endDate: MoreThanOrEqual(endDate)
            }
          ],
          relations: ['employee']
        });
        
        // Format the response to match what the frontend expects
        const formattedLeaves = leaveRequests.map((leave: LeaveRequest) => {
          // Ensure dates are properly formatted
          let startDateStr = '';
          let endDateStr = '';
          
          try {
            // Try to convert to ISO string if it's a Date object
            if (leave.startDate instanceof Date) {
              startDateStr = leave.startDate.toISOString().split('T')[0];
            } else if (typeof leave.startDate === 'string') {
              // If it's already a string, try to format it
              startDateStr = new Date(leave.startDate).toISOString().split('T')[0];
            } else {
              // Fallback
              startDateStr = String(leave.startDate);
            }
            
            if (leave.endDate instanceof Date) {
              endDateStr = leave.endDate.toISOString().split('T')[0];
            } else if (typeof leave.endDate === 'string') {
              endDateStr = new Date(leave.endDate).toISOString().split('T')[0];
            } else {
              endDateStr = String(leave.endDate);
            }
          } catch (error) {
            console.error('Error formatting dates:', error);
            // Fallback to string representation
            startDateStr = String(leave.startDate);
            endDateStr = String(leave.endDate);
          }
          
          return {
            id: leave.id,
            employeeName: leave.employee?.name || 'Unknown Employee', // Using the name field from Employee entity with fallback
            startDate: startDateStr, // Format as YYYY-MM-DD
            endDate: endDateStr,     // Format as YYYY-MM-DD
            leaveType: leave.leaveType || 'Annual Leave' // Using the new leaveType field
          };
        });
        
        return h.response(formattedLeaves).code(200);
      } catch (error) {
        console.error('Error fetching team leaves:', error);
        return h.response({ 
          message: 'Failed to fetch team leaves',
          error: error instanceof Error ? error.message : 'Unknown error'
        }).code(500);
      }
    }
  },
  {
    method: 'GET',
    path: '/api/leave-history',
    handler: async (request, h) => {
      const repo = (request.server.app as any).dataSource.getRepository(LeaveRequest);
      const userId = (request.auth.credentials as any).id;

      const leaveHistory = await repo.find({
        where: { employee: { id: userId }, status: 'Approved' },
        relations: ['employee', 'approvals'],
        order: { createdAt: 'DESC' }
      });

      return h.response(leaveHistory).code(200);
    },
  },

  // Get Leave Balance for Employee
  {
    method: 'GET',
    path: '/api/leave-balance',
    handler: async (request, h) => {
      const userId = (request.auth.credentials as any).id;
      const employeeRepo = (request.server.app as any).dataSource.getRepository('Employee');

      const employee = await employeeRepo.findOne({ where: { id: userId } });

      if (!employee) {
        return h.response({ message: 'Employee not found' }).code(404);
      }

      // Calculate leave balance (implement the logic in the service)
      const leaveBalance = await calculateLeaveBalance(userId);
      return h.response({ leaveBalance }).code(200);
    },
  },

  // Carry Forward Unused Leave to Next Year
  {
    method: 'POST',
    path: '/api/leave/carry-forward',
    handler: async (request, h) => {
      const { employeeId, year } = request.payload as { employeeId: number; year: number };

      const leaveRepo = (request.server.app as any).dataSource.getRepository(LeaveRequest);
      const employeeRepo = (request.server.app as any).dataSource.getRepository('Employee');

      const employee = await employeeRepo.findOne({ where: { id: employeeId } });

      if (!employee) {
        return h.response({ message: 'Employee not found' }).code(404);
      }

      
      const carriedForwardLeave = await carryForwardLeave(employeeId, year); 
      return h.response({ carriedForwardLeave }).code(200);
    },
  },

  // Get all leave requests
  {
    method: 'GET',
    path: '/api/leave-requests',
    handler: async (request, h) => {
      const repo = (request.server.app as any).dataSource.getRepository(LeaveRequest);
      const userId = (request.auth.credentials as any).id;

      const leaveRequests = await repo.find({
        where: { employee: { id: userId } },
        relations: ['employee', 'approvals', 'approvals.approver'],
        order: { createdAt: 'DESC' }
      });

      return h.response(leaveRequests).code(200);
    },
  },

  // Pending list
  {
    method: 'GET',
    path: '/api/leave-requests/pending',
    handler: async (request, h) => {
      const repo = (request.server.app as any).dataSource.getRepository(LeaveRequest);
      const userRole = (request.auth.credentials as any).role;
      const userId = (request.auth.credentials as any).id;
      
      let whereCondition = {};
      
      if (userRole === 'HR') {
        // HR users see both Pending and Manager Approved requests
        whereCondition = [
          { status: 'Pending' },
          { status: 'Manager Approved' }
        ];
      } else if (userRole === 'Manager') {
        // Managers only see Pending requests from their team members
        whereCondition = { 
          status: 'Pending',
          employee: { manager: { id: userId } }
        };
      } else {
        // Regular employees don't see pending requests
        whereCondition = { id: -1 }; // No results
      }
      
      const pending = await repo.find({
        where: whereCondition,
        relations: ['employee', 'approvals', 'approvals.approver'],
        order: { createdAt: 'DESC' }
      });
      
      return h.response(pending).code(200);
    },
  },
  
  // All leave requests (including approved/rejected)
  {
    method: 'GET',
    path: '/api/leave-requests/all',
    handler: async (request, h) => {
      const repo = (request.server.app as any).dataSource.getRepository(LeaveRequest);
      const userId = (request.auth.credentials as any).id;
      const userRole = (request.auth.credentials as any).role;
      
      let whereCondition = {};
      
      if (userRole === 'HR') {
        whereCondition = {};
      } else if (userRole === 'Manager') {
        whereCondition = [
          { employee: { manager: { id: userId } } }, 
          { employee: { id: userId } } 
        ];
      } else {
        // Regular employees only see their own requests
        whereCondition = { employee: { id: userId } };
      }
      
      const allRequests = await repo.find({
        where: whereCondition,
        relations: ['employee', 'approvals', 'approvals.approver'],
        order: { createdAt: 'DESC' }
      });
      
      return h.response(allRequests).code(200);
    },
  },

  // Manager approval => uses ApprovalController
  {
    method: 'POST',
    path: '/api/leave-requests/{id}/approve/manager',
    options: { pre: [isAuthenticated, isManager] },
    handler: ApprovalController.managerDecision,
  },

  // HR approval -> uses ApprovalController
  {
    method: 'POST',
    path: '/api/leave-requests/{id}/approve/hr',
    options: { pre: [isAuthenticated, isHR] },
    handler: ApprovalController.hrDecision, 
  },

  // Create new leave request
  {
    method: 'POST',
    path: '/api/leave-requests',
    handler: async (request, h) => {
      try {
        const { startDate, endDate, reason, leaveType } = request.payload as any;
        const userId = (request.auth.credentials as any).id;

        const repo = (request.server.app as any).dataSource.getRepository(LeaveRequest);
        const employeeRepo = (request.server.app as any).dataSource.getRepository('Employee');

        const employee = await employeeRepo.findOne({ where: { id: userId }, relations: ['manager'] });

        if (!employee) {
          return h.response({ message: 'Employee not found' }).code(404);
        }

        const leaveRequest = new LeaveRequest();
        leaveRequest.startDate = new Date(startDate);
        leaveRequest.endDate = new Date(endDate);
        leaveRequest.reason = reason;
        leaveRequest.leaveType = leaveType || 'Annual Leave'; 
        leaveRequest.employee = employee;
        leaveRequest.manager = employee.manager;
        
        // Check if the requester is a manager
        const userRole = (request.auth.credentials as any).role;
        
        // If the requester is a manager, skip manager approval
        if (userRole === 'Manager') {
          leaveRequest.status = 'Manager Approved';
        } else {
          leaveRequest.status = 'Pending';
        }

        const savedRequest = await repo.save(leaveRequest);

        // Create approvals
        const approvalRepo = (request.server.app as any).dataSource.getRepository('Approval');

        // Manager approval (only for regular employees)
        if (employee.manager && userRole !== 'Manager') {
          const managerApproval = approvalRepo.create({
            leaveRequest: savedRequest,
            approver: employee.manager,
            level: 'manager',
            status: 'Pending'
          });
          await approvalRepo.save(managerApproval);
        } else if (userRole === 'Manager') {
          // Auto-approve for managers
          const managerApproval = approvalRepo.create({
            leaveRequest: savedRequest,
            approver: employee, // Self-approval
            level: 'manager',
            status: 'Approved'
          });
          await approvalRepo.save(managerApproval);
        }

        // HR approval
        const hrRepo = (request.server.app as any).dataSource.getRepository('Employee');
        const hr = await hrRepo.findOne({ where: { role: 'HR' } });

        if (hr) {
          const hrApproval = approvalRepo.create({
            leaveRequest: savedRequest,
            approver: hr,
            level: 'hr',
            status: 'Pending'
          });
          await approvalRepo.save(hrApproval);
        }

        return h.response(savedRequest).code(201);
      } catch (error) {
        console.error('Error creating leave request:', error);
        return h.response({ 
          message: 'Failed to create leave request',
          error: error instanceof Error ? error.message : 'Unknown error'
        }).code(500);
      }
    },
  },
];

export default leaveRoutes;
