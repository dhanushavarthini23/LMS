import { ServerRoute } from '@hapi/hapi';
import AppDataSource from '../data-source';
import { LeaveRequest } from '../entities/LeaveRequest';
import { ApprovalController } from '../controllers/ApprovalController';
import { isAuthenticated, isManager, isHR } from '../middlewares/authorization';
import { calculateLeaveBalance, carryForwardLeave } from '../services/leaveServices';

const leaveRoutes: ServerRoute[] = [
  // Existing routes...

  // Leave History for Employee
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

      // Implement logic to carry forward unused leave
      const carriedForwardLeave = await carryForwardLeave(employeeId, year); // Implement this function
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
      const pending = await repo.find({
        where: { status: 'Pending' },
        relations: ['employee', 'approvals'],
      });
      return h.response(pending).code(200);
    },
  },

  // Manager approval → uses ApprovalController
  {
    method: 'POST',
    path: '/api/leave-requests/{id}/approve/manager',
    options: { pre: [isAuthenticated, isManager] },
    handler: ApprovalController.managerDecision,
  },

  // HR approval → uses ApprovalController
  {
    method: 'POST',
    path: '/api/leave-requests/{id}/approve/hr',
    options: { pre: [isAuthenticated, isHR] },
    handler: ApprovalController.hrDecision, // Directly use the controller method
  },

  // Create new leave request
  {
    method: 'POST',
    path: '/api/leave-requests',
    handler: async (request, h) => {
      try {
        const { startDate, endDate, reason } = request.payload as any;
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
        leaveRequest.status = 'Pending';
        leaveRequest.employee = employee;
        leaveRequest.manager = employee.manager;

        const savedRequest = await repo.save(leaveRequest);

        // Create approvals
        const approvalRepo = (request.server.app as any).dataSource.getRepository('Approval');

        // Manager approval
        if (employee.manager) {
          const managerApproval = approvalRepo.create({
            leaveRequest: savedRequest,
            approver: employee.manager,
            level: 'manager',
            status: 'Pending'
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
        return h.response({ message: 'Failed to create leave request' }).code(500);
      }
    },
  },
];

export default leaveRoutes;
