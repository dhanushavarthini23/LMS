import { ServerRoute } from '@hapi/hapi';
import AppDataSource from '../data-source';
import { LeaveRequest } from '../entities/LeaveRequest';
import { ApprovalController } from '../controllers/ApprovalController';
import { isAuthenticated, isManager, isHR } from '../middlewares/authorization';
import { calculateLeaveBalance, carryForwardLeave } from '../services/leaveServices';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import Joi from 'joi';

const leaveRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/api/leaves/team',
    options: {
      auth: false,
      tags: ['api', 'leaves'],
      description: 'Get team leaves for a specific month and year',
      notes: 'Returns all approved leave requests for the specified month and year',
      validate: {
        query: Joi.object({
          year: Joi.number().integer().min(2000).max(2100).description('Year for leave requests'),
          month: Joi.number().integer().min(1).max(12).description('Month for leave requests (1-12)')
        })
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Successful response with team leaves',
              schema: Joi.array().items(
                Joi.object({
                  id: Joi.number().required().description('Leave request ID'),
                  employeeName: Joi.string().required().description('Name of the employee'),
                  startDate: Joi.string().required().description('Start date of leave'),
                  endDate: Joi.string().required().description('End date of leave'),
                  leaveType: Joi.string().required().description('Type of leave')
                })
              )
            },
            '500': {
              description: 'Server error',
              schema: Joi.object({
                message: Joi.string().required(),
                error: Joi.string().required()
              })
            }
          }
        }
      }
    },
    handler: async (request, h) => {
      try {
        const query = request.query as any;
        const now = new Date();
        const year = query.year ? parseInt(query.year) : now.getFullYear();
        const month = query.month ? parseInt(query.month) : now.getMonth() + 1; 
        const startDate = new Date(year, month - 1, 1); 
        const endDate = new Date(year, month, 0); 
        const leaveRepo = (request.server.app as any).dataSource.getRepository(LeaveRequest);
        
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
        const formattedLeaves = leaveRequests.map((leave: LeaveRequest) => {
          let startDateStr = '';
          let endDateStr = '';
          
          try {
            if (leave.startDate instanceof Date) {
              startDateStr = leave.startDate.toISOString().split('T')[0];
            } else if (typeof leave.startDate === 'string') {
              startDateStr = new Date(leave.startDate).toISOString().split('T')[0];
            } else {
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
            employeeName: leave.employee?.name || 'Unknown Employee', 
            startDate: startDateStr, 
            endDate: endDateStr,     
            leaveType: leave.leaveType || 'Annual Leave' 
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
    options: {
      tags: ['api', 'leave-requests'],
      description: 'Get pending leave requests',
      notes: 'Returns pending leave requests based on user role. HR users see both Pending and Manager Approved requests. Managers only see Pending requests from their team members.',
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'List of pending leave requests',
              schema: Joi.array().items(
                Joi.object({
                  id: Joi.number().required(),
                  startDate: Joi.date().required(),
                  endDate: Joi.date().required(),
                  reason: Joi.string().required(),
                  leaveType: Joi.string().required(),
                  status: Joi.string().required(),
                  employee: Joi.object().required(),
                  approvals: Joi.array().items(Joi.object())
                })
              )
            },
            '500': {
              description: 'Server error'
            }
          }
        }
      }
    },
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
        whereCondition = { id: -1 }; 
      }
      
      const pending = await repo.find({
        where: whereCondition,
        relations: ['employee', 'approvals', 'approvals.approver'],
        order: { createdAt: 'DESC' }
      });
      
      return h.response(pending).code(200);
    },
  },
  
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
    options: { 
      pre: [isAuthenticated, isManager],
      tags: ['api', 'approvals'],
      description: 'Manager approval for leave request',
      notes: 'Allows a manager to approve or reject a leave request',
      validate: {
        params: Joi.object({
          id: Joi.number().required().description('Leave request ID')
        }),
        payload: Joi.object({
          decision: Joi.string().valid('approve', 'reject').required().description('Approval decision'),
          comment: Joi.string().allow('').optional().description('Optional comment for the decision')
        })
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Leave request processed successfully',
              schema: Joi.object({
                message: Joi.string().required(),
                leaveRequest: Joi.object()
              })
            },
            '400': {
              description: 'Bad request',
              schema: Joi.object({
                message: Joi.string().required()
              })
            },
            '404': {
              description: 'Leave request not found',
              schema: Joi.object({
                message: Joi.string().required()
              })
            }
          }
        }
      }
    },
    handler: ApprovalController.managerDecision,
  },

  // HR approval -> uses ApprovalController
  {
    method: 'POST',
    path: '/api/leave-requests/{id}/approve/hr',
    options: { 
      pre: [isAuthenticated, isHR],
      tags: ['api', 'approvals'],
      description: 'HR approval for leave request',
      notes: 'Allows an HR representative to approve or reject a leave request',
      validate: {
        params: Joi.object({
          id: Joi.number().required().description('Leave request ID')
        }),
        payload: Joi.object({
          decision: Joi.string().valid('approve', 'reject').required().description('Approval decision'),
          comment: Joi.string().allow('').optional().description('Optional comment for the decision')
        })
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Leave request processed successfully',
              schema: Joi.object({
                message: Joi.string().required(),
                leaveRequest: Joi.object()
              })
            },
            '400': {
              description: 'Bad request',
              schema: Joi.object({
                message: Joi.string().required()
              })
            },
            '404': {
              description: 'Leave request not found',
              schema: Joi.object({
                message: Joi.string().required()
              })
            }
          }
        }
      }
    },
    handler: ApprovalController.hrDecision, 
  },

  // Create new leave request
  {
    method: 'POST',
    path: '/api/leave-requests',
    options: {
      tags: ['api', 'leave-requests'],
      description: 'Create a new leave request',
      notes: 'Creates a new leave request for the authenticated user',
      validate: {
        payload: Joi.object({
          startDate: Joi.date().required().description('Start date of leave'),
          endDate: Joi.date().required().description('End date of leave'),
          reason: Joi.string().required().description('Reason for leave request'),
          leaveType: Joi.string().default('Annual Leave').description('Type of leave (default: Annual Leave)')
        })
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '201': {
              description: 'Leave request created successfully',
              schema: Joi.object({
                id: Joi.number().required(),
                startDate: Joi.date().required(),
                endDate: Joi.date().required(),
                reason: Joi.string().required(),
                leaveType: Joi.string().required(),
                status: Joi.string().required(),
                employee: Joi.object().required(),
                manager: Joi.object().allow(null)
              })
            },
            '404': {
              description: 'Employee not found',
              schema: Joi.object({
                message: Joi.string().required()
              })
            },
            '500': {
              description: 'Server error',
              schema: Joi.object({
                message: Joi.string().required(),
                error: Joi.string().required()
              })
            }
          }
        }
      }
    },
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
