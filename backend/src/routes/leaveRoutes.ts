import { ServerRoute } from '@hapi/hapi';
import AppDataSource from '../data-source';
import { LeaveRequest } from '../entities/LeaveRequest';
import { LeaveType } from '../entities/LeaveType';
import { Employee } from '../entities/Employee';
import { ApprovalController } from '../controllers/ApprovalController';
import { isAuthenticated, isManager, isHR } from '../middlewares/authorization';
import { calculateLeaveBalance, carryForwardLeave, validateLeaveRequest } from '../services/leaveServices';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import Joi from 'joi';

const leaveRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/api/leaves/team',
    options: {
      auth: { mode: 'try' },
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
          relations: ['employee', 'leaveType']
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
            leaveType: leave.leaveType?.name || 'Annual Leave' 
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
    options: {
      auth: 'jwt',
      tags: ['api', 'leaves'],
      description: 'Get leave history for authenticated user',
      notes: 'Returns all approved leave requests for the authenticated employee',
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Leave history retrieved successfully',
              schema: Joi.array().items(
                Joi.object({
                  id: Joi.number().required().description('Leave request ID'),
                  startDate: Joi.date().required().description('Start date of leave'),
                  endDate: Joi.date().required().description('End date of leave'),
                  reason: Joi.string().required().description('Reason for leave'),
                  leaveType: Joi.string().required().description('Type of leave'),
                  status: Joi.string().required().description('Leave status'),
                  employee: Joi.object().required().description('Employee details'),
                  approvals: Joi.array().items(Joi.object()).description('Approval details'),
                  createdAt: Joi.date().description('Request creation date')
                })
              )
            },
            '500': {
              description: 'Server error',
              schema: Joi.object({
                message: Joi.string().required()
              })
            }
          }
        }
      }
    },
    handler: async (request, h) => {
      const repo = (request.server.app as any).dataSource.getRepository(LeaveRequest);
      const userId = (request.auth.credentials as any).id;

      const leaveHistory = await repo.find({
        where: { employee: { id: userId } },
        relations: ['employee', 'approvals', 'leaveType'],
        order: { createdAt: 'DESC' }
      });

      return h.response(leaveHistory).code(200);
    },
  },
  {
    method: 'GET',
    path: '/api/leave-balance',
    options: {
      auth: 'jwt',
      tags: ['api', 'leaves'],
      description: 'Get leave balance for authenticated user',
      notes: 'Returns the current leave balance for the authenticated employee',
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Leave balance retrieved successfully',
              schema: Joi.object({
                balances: Joi.object().required().description('Leave balances by type'),
                totalTaken: Joi.number().required().description('Total leave days taken'),
                totalEntitlement: Joi.number().required().description('Total leave entitlement'),
                annual: Joi.number().required().description('Annual leave balance (legacy)'),
                sick: Joi.number().required().description('Sick leave balance (legacy)'),
                personal: Joi.number().required().description('Personal leave balance (legacy)')
              })
            },
            '404': {
              description: 'Employee not found',
              schema: Joi.object({
                message: Joi.string().required().example('Employee not found')
              })
            },
            '500': {
              description: 'Server error',
              schema: Joi.object({
                message: Joi.string().required()
              })
            }
          }
        }
      }
    },
    handler: async (request, h) => {
      try {
        const userId = (request.auth.credentials as any).id;
        
        const employeeRepo = AppDataSource.getRepository(Employee);
        const employee = await employeeRepo.findOne({ where: { id: userId } });

        if (!employee) {
          return h.response({ message: 'Employee not found' }).code(404);
        }
        const leaveBalance = await calculateLeaveBalance(userId);
        return h.response({ leaveBalance }).code(200);
      } catch (error) {
        console.error('Error getting leave balance:', error);
        return h.response({ message: 'Server error'}).code(500);
      }
    },
  },
  
  {
    method: 'GET',
    path: '/api/leave-balance/{employeeId}',
    options: {
      auth: 'jwt',
      tags: ['api', 'leaves'],
      description: 'Get leave balance for a specific employee',
      notes: 'Returns the current leave balance for the specified employee. Requires Manager or HR role.',
      validate: {
        params: Joi.object({
          employeeId: Joi.number().required().description('Employee ID')
        })
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Leave balance retrieved successfully',
              schema: Joi.object({
                balances: Joi.object().required().description('Leave balances by type'),
                totalTaken: Joi.number().required().description('Total leave days taken'),
                totalEntitlement: Joi.number().required().description('Total leave entitlement'),
                annual: Joi.number().required().description('Annual leave balance (legacy)'),
                sick: Joi.number().required().description('Sick leave balance (legacy)'),
                personal: Joi.number().required().description('Personal leave balance (legacy)')
              })
            },
            '403': {
              description: 'Unauthorized access',
              schema: Joi.object({
                message: Joi.string().required().example('Unauthorized access')
              })
            },
            '404': {
              description: 'Employee not found',
              schema: Joi.object({
                message: Joi.string().required().example('Employee not found')
              })
            },
            '500': {
              description: 'Server error',
              schema: Joi.object({
                message: Joi.string().required()
              })
            }
          }
        }
      }
    },
    handler: async (request, h) => {
      try {
        const { employeeId } = request.params as { employeeId: number };
        const userRole = (request.auth.credentials as any).role;
        const userId = (request.auth.credentials as any).id;
        
        // Check authorization - only HR or the employee's manager can view
        if (userRole !== 'HR' && userRole !== 'Manager') {
          return h.response({ message: 'Unauthorized access' }).code(403);
        }
        
        const employeeRepo = AppDataSource.getRepository(Employee);
        const employee = await employeeRepo.findOne({ 
          where: { id: employeeId },
          relations: ['manager']
        });

        if (!employee) {
          return h.response({ message: 'Employee not found' }).code(404);
        }
        
        // If manager, check if this is their team member
        if (userRole === 'Manager' && employee.manager?.id !== userId && employeeId !== userId) {
          return h.response({ message: 'Unauthorized access' }).code(403);
        }
        
        const leaveBalance = await calculateLeaveBalance(employeeId);
        return h.response({ leaveBalance }).code(200);
      } catch (error) {
        console.error('Error getting employee leave balance:', error);
        return h.response({ message: 'Server error'}).code(500);
      }
    },
  },

  // Carry Forward Unused Leave to Next Year
  {
    method: 'POST',
    path: '/api/leave/carry-forward',
    options: {
      auth: 'jwt',
      tags: ['api', 'leaves'],
      description: 'Carry forward unused leave to next year',
      notes: 'Allows carrying forward unused leave balance to the next year',
      validate: {
        payload: Joi.object({
          employeeId: Joi.number().required().description('Employee ID for carry forward'),
          year: Joi.number().integer().min(2000).max(2100).required().description('Year to carry forward from')
        })
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Leave carried forward successfully',
              schema: Joi.object({
                carriedForwardLeave: Joi.number().required().description('Amount of leave carried forward')
              })
            },
            '404': {
              description: 'Employee not found',
              schema: Joi.object({
                message: Joi.string().required().example('Employee not found')
              })
            },
            '500': {
              description: 'Server error',
              schema: Joi.object({
                message: Joi.string().required()
              })
            }
          }
        }
      }
    },
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
    options: {
      auth: 'jwt',
      tags: ['api', 'leave-requests'],
      description: 'Get all leave requests for authenticated user',
      notes: 'Returns all leave requests for the authenticated employee',
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Leave requests retrieved successfully',
              schema: Joi.array().items(
                Joi.object({
                  id: Joi.number().required().description('Leave request ID'),
                  startDate: Joi.date().required().description('Start date of leave'),
                  endDate: Joi.date().required().description('End date of leave'),
                  reason: Joi.string().required().description('Reason for leave'),
                  leaveType: Joi.string().required().description('Type of leave'),
                  status: Joi.string().required().description('Leave status'),
                  employee: Joi.object().required().description('Employee details'),
                  approvals: Joi.array().items(Joi.object()).description('Approval details'),
                  createdAt: Joi.date().description('Request creation date')
                })
              )
            },
            '500': {
              description: 'Server error',
              schema: Joi.object({
                message: Joi.string().required()
              })
            }
          }
        }
      }
    },
    handler: async (request, h) => {
      const repo = (request.server.app as any).dataSource.getRepository(LeaveRequest);
      const userId = (request.auth.credentials as any).id;

      const leaveRequests = await repo.find({
        where: { employee: { id: userId } },
        relations: ['employee', 'approvals', 'approvals.approver', 'leaveType'],
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
      notes: 'Returns pending leave requests based on user role. HR and Admin users see both Pending and Manager Approved requests. Managers only see Pending requests from their team members.',
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
      
      if (userRole === 'HR' || userRole === 'Admin') {
        // HR and Admin users see both Pending and Manager Approved requests
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
        relations: ['employee', 'employee.department', 'approvals', 'approvals.approver', 'leaveType'],
        order: { createdAt: 'DESC' }
      });
      
      return h.response(pending).code(200);
    },
  },
  
  {
    method: 'GET',
    path: '/api/leave-requests/all',
    options: {
      auth: 'jwt',
      tags: ['api', 'leave-requests'],
      description: 'Get all leave requests based on user role',
      notes: 'Returns leave requests based on user role: HR sees all, Managers see their team + own, Employees see only their own',
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Leave requests retrieved successfully',
              schema: Joi.array().items(
                Joi.object({
                  id: Joi.number().required().description('Leave request ID'),
                  startDate: Joi.date().required().description('Start date of leave'),
                  endDate: Joi.date().required().description('End date of leave'),
                  reason: Joi.string().required().description('Reason for leave'),
                  leaveType: Joi.string().required().description('Type of leave'),
                  status: Joi.string().required().description('Leave status'),
                  employee: Joi.object().required().description('Employee details'),
                  approvals: Joi.array().items(Joi.object()).description('Approval details'),
                  createdAt: Joi.date().description('Request creation date')
                })
              )
            },
            '500': {
              description: 'Server error',
              schema: Joi.object({
                message: Joi.string().required()
              })
            }
          }
        }
      }
    },
    handler: async (request, h) => {
      const repo = (request.server.app as any).dataSource.getRepository(LeaveRequest);
      const userId = (request.auth.credentials as any).id;
      const userRole = (request.auth.credentials as any).role;
      
      let whereCondition = {};
      
      if (userRole === 'HR' || userRole === 'Admin') {
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
        relations: ['employee', 'employee.department', 'approvals', 'approvals.approver', 'leaveType'],
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
          decision: Joi.string().valid('approve', 'reject').required().description('Approval decision')
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
          decision: Joi.string().valid('approve', 'reject').required().description('Approval decision')
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
          leaveTypeId: Joi.number().required().description('Leave type ID from the leave_types table'),
          justification: Joi.string().allow(null, '').description('Justification for backdated requests'),
          isBackdated: Joi.boolean().default(false).description('Whether this is a backdated request')
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
        const { startDate, endDate, reason, leaveTypeId, justification, isBackdated } = request.payload as any;
        const userId = (request.auth.credentials as any).id;

        const repo = (request.server.app as any).dataSource.getRepository(LeaveRequest);
        const employeeRepo = (request.server.app as any).dataSource.getRepository('Employee');
        const leaveTypeRepo = (request.server.app as any).dataSource.getRepository(LeaveType);

        // Fetch employee and leave type
        const employee = await employeeRepo.findOne({ where: { id: userId }, relations: ['manager'] });
        const leaveType = await leaveTypeRepo.findOne({ where: { id: leaveTypeId, isActive: true } });

        if (!employee) {
          return h.response({ message: 'Employee not found' }).code(404);
        }

        if (!leaveType) {
          return h.response({ message: 'Invalid leave type selected' }).code(400);
        }

        // Validate backdated requests
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const requestStartDate = new Date(startDate);
        const isActuallyBackdated = requestStartDate < today;

        if (isActuallyBackdated) {
          // Only allow backdated requests for sick leave
          const isSickLeave = leaveType.name.toLowerCase().includes('sick');
          if (!isSickLeave) {
            return h.response({ message: 'Backdated leave requests are only allowed for sick leave' }).code(400);
          }

          // Check if within allowed period (14 days)
          const daysDiff = Math.ceil((today.getTime() - requestStartDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff > 14) {
            return h.response({ message: 'Backdated sick leave requests are only allowed within 14 days' }).code(400);
          }

          // Require justification for backdated requests
          if (!justification || justification.trim() === '') {
            return h.response({ message: 'Justification is required for backdated leave requests' }).code(400);
          }
        }

        const leaveRequest = new LeaveRequest();
        leaveRequest.startDate = new Date(startDate);
        leaveRequest.endDate = new Date(endDate);
        leaveRequest.reason = reason;
        leaveRequest.leaveType = leaveType; 
        leaveRequest.employee = employee;
        leaveRequest.justification = justification;
        leaveRequest.isBackdated = isActuallyBackdated;
        leaveRequest.manager = employee.manager;
        
        // Determine approval flow based on leave type and user role
        const userRole = (request.auth.credentials as any).role;
        const approvalRepo = (request.server.app as any).dataSource.getRepository('Approval');
        if (isActuallyBackdated && userRole !== 'HR') {
          leaveRequest.status = 'Pending';
        } else if (!leaveType.requiresApproval) {
          leaveRequest.status = 'Approved';
        } else if (userRole === 'HR') {
          leaveRequest.status = 'Approved';
        } else if (userRole === 'Manager' && leaveType.approvalLevels === 1 && !isActuallyBackdated) {
          leaveRequest.status = 'Approved';
        } else if (userRole === 'Manager' && leaveType.approvalLevels === 2) {
          leaveRequest.status = 'Manager Approved';
        } else {
          leaveRequest.status = 'Pending';
        }

        const savedRequest = await repo.save(leaveRequest);
        if (leaveType.requiresApproval) {
          // Level 1: Manager approval (if needed)
          if (leaveType.approvalLevels >= 1 && userRole !== 'Manager' && userRole !== 'HR') {
            if (employee.manager) {
              const managerApproval = approvalRepo.create({
                leaveRequest: savedRequest,
                approver: employee.manager,
                level: 'manager',
                status: 'Pending'
              });
              await approvalRepo.save(managerApproval);
            }
          } else if (userRole === 'Manager' && leaveType.approvalLevels >= 1) {
            // Self-approval for managers
            const managerApproval = approvalRepo.create({
              leaveRequest: savedRequest,
              approver: employee,
              level: 'manager',
              status: 'Approved'
            });
            await approvalRepo.save(managerApproval);
          }

          // Level 2: HR approval (if needed)
          if (leaveType.approvalLevels >= 2 && userRole !== 'HR') {
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
          } else if (userRole === 'HR') {
            // Self-approval for HR
            const hrApproval = approvalRepo.create({
              leaveRequest: savedRequest,
              approver: employee,
              level: 'hr',
              status: 'Approved'
            });
            await approvalRepo.save(hrApproval);
          }
        }

        // Fetch the saved request with all relations to return to the client
        const completeRequest = await repo.findOne({
          where: { id: savedRequest.id },
          relations: ['employee', 'leaveType', 'manager']
        });
        
        return h.response(completeRequest).code(201);
      } catch (error) {
        console.error('Error creating leave request:', error);
        return h.response({ 
          message: 'Failed to create leave request',
          error: error instanceof Error ? error.message : 'Unknown error'
        }).code(500);
      }
    },
  },
  // Get leave balances for all employees (Manager/HR only)
  {
    method: 'GET',
    path: '/api/employees/leave-balances',
    options: {
      auth: 'jwt',
      tags: ['api', 'employees'],
      description: 'Get leave balances for all employees',
      notes: 'Returns leave balance information for all employees. Accessible by managers and HR only.',
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Employee leave balances retrieved successfully',
              schema: Joi.array().items(
                Joi.object({
                  employeeId: Joi.number().required().description('Employee ID'),
                  employeeName: Joi.string().required().description('Employee name'),
                  leaveBalance: Joi.object().required().description('Leave balance details')
                })
              )
            },
            '403': {
              description: 'Access denied',
              schema: Joi.object({
                message: Joi.string().required()
              })
            },
            '500': {
              description: 'Server error',
              schema: Joi.object({
                message: Joi.string().required()
              })
            }
          }
        }
      }
    },
    handler: async (request, h) => {
      try {
        const userRole = (request.auth.credentials as any).role;
        if (userRole !== 'Manager' && userRole !== 'HR') {
          return h.response({ message: 'Access denied. Only managers and HR can view employee leave balances.' }).code(403);
        }

        const employeeRepo = (request.server.app as any).dataSource.getRepository('Employee');
        const employees = await employeeRepo.find();

        const employeeBalances = await Promise.all(
          employees.map(async (employee:any) => {
            try {
              const leaveBalance = await calculateLeaveBalance(employee.id);
              return {
                employeeId: employee.id,
                employeeName: employee.name,
                email: employee.email,
                department: employee.department?.name || 'General',
                leaveBalance
              };
            } catch (error) {
              console.error(`Error calculating leave balance for employee ${employee.id}:`, error);
              return {
                employeeId: employee.id,
                employeeName: employee.name,
                email: employee.email,
                department: employee.department?.name || 'General',
                leaveBalance: {
                  balances: {},
                  totalTaken: 0,
                  totalEntitlement: 0,
                  annual: 20,
                  sick: 10,
                  personal: 5
                }
              };
            }
          })
        );

        return h.response(employeeBalances).code(200);
      } catch (error) {
        console.error('Error fetching employee leave balances:', error);
        return h.response({ message: 'Server error' }).code(500);
      }
    }
  },
  {
    method: 'POST',
    path: '/api/leaves/validate',
    options: {
      auth: 'jwt',
      tags: ['api', 'leaves'],
      description: 'Validate leave request dates and calculate working days',
      notes: 'Returns working days calculation excluding weekends',
      validate: {
        payload: Joi.object({
          startDate: Joi.string().isoDate().required().description('Start date of leave (YYYY-MM-DD)'),
          endDate: Joi.string().isoDate().required().description('End date of leave (YYYY-MM-DD)')
        })
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Leave validation successful',
              schema: Joi.object({
                totalDays: Joi.number().required().description('Total days in the range'),
                workingDays: Joi.number().required().description('Working days (excluding weekends)'),
                weekendDays: Joi.number().required().description('Weekend days excluded'),
                weekends: Joi.array().items(Joi.string()).description('List of weekend dates'),
                message: Joi.string().required().description('Descriptive message about the calculation')
              })
            },
            '400': {
              description: 'Invalid date range',
              schema: Joi.object({
                error: Joi.string().required()
              })
            },
            '500': {
              description: 'Server error',
              schema: Joi.object({
                error: Joi.string().required()
              })
            }
          }
        }
      },
      handler: async (request: any, h: any) => {
        try {
          const { startDate, endDate } = request.payload;
          
          const start = new Date(startDate);
          const end = new Date(endDate);
          
          // Validate date range
          if (start > end) {
            return h.response({ error: 'Start date must be before or equal to end date' }).code(400);
          }
          
          const validation = validateLeaveRequest(start, end);
          return h.response(validation).code(200);
        } catch (error) {
          console.error('Error validating leave request:', error);
          return h.response({ error: 'Server error' }).code(500);
        }
      }
    }
  },

  // Cancel/Delete leave request
  {
    method: 'DELETE',
    path: '/api/leave-requests/{id}',
    options: {
      auth: 'jwt',
      tags: ['api', 'leave-requests'],
      description: 'Cancel a leave request',
      notes: 'Allows employees to cancel their own pending leave requests',
      validate: {
        params: Joi.object({
          id: Joi.number().required().description('Leave request ID to cancel')
        })
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Leave request cancelled successfully',
              schema: Joi.object({
                message: Joi.string().required().example('Leave request cancelled successfully')
              })
            },
            '403': {
              description: 'Unauthorized - cannot cancel this request',
              schema: Joi.object({
                message: Joi.string().required().example('You can only cancel your own pending leave requests')
              })
            },
            '404': {
              description: 'Leave request not found',
              schema: Joi.object({
                message: Joi.string().required().example('Leave request not found')
              })
            },
            '400': {
              description: 'Cannot cancel approved/rejected requests',
              schema: Joi.object({
                message: Joi.string().required().example('Cannot cancel approved or rejected leave requests')
              })
            },
            '500': {
              description: 'Server error',
              schema: Joi.object({
                message: Joi.string().required()
              })
            }
          }
        }
      }
    },
    handler: async (request, h) => {
      try {
        const { id } = request.params as { id: number };
        const userId = (request.auth.credentials as any).id;

        const repo = (request.server.app as any).dataSource.getRepository(LeaveRequest);
        const leaveRequest = await repo.findOne({
          where: { id },
          relations: ['employee', 'approvals']
        });

        if (!leaveRequest) {
          return h.response({ message: 'Leave request not found' }).code(404);
        }
        if (leaveRequest.employee.id !== userId) {
          return h.response({ message: 'You can only cancel your own leave requests' }).code(403);
        }
        if (leaveRequest.status !== 'Pending') {
          return h.response({ 
            message: 'Cannot cancel approved or rejected leave requests' 
          }).code(400);
        }
        if (leaveRequest.approvals && leaveRequest.approvals.length > 0) {
          const approvalRepo = (request.server.app as any).dataSource.getRepository('Approval');
          await approvalRepo.remove(leaveRequest.approvals);
        }
        
        await repo.remove(leaveRequest);

        return h.response({ message: 'Leave request cancelled successfully' }).code(200);
      } catch (error) {
        console.error('Error cancelling leave request:', error);
        return h.response({ message: 'Server error' }).code(500);
      }
    }
  }
];

export default leaveRoutes;
