import { ServerRoute } from '@hapi/hapi';
import AppDataSource from '../data-source';
import { LeaveRequest } from '../entities/LeaveRequest';
import { ApprovalController } from '../controllers/ApprovalController';
import { isAuthenticated, isManager, isHR } from '../middlewares/authorization';

const leaveRoutes: ServerRoute[] = [
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
];

export default leaveRoutes;
