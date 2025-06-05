import { ServerRoute } from '@hapi/hapi';
import AppDataSource from '../data-source';
import { LeaveType } from '../entities/LeaveType';
import Joi from 'joi';

const leaveTypeRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/api/leave-types',
    options: {
      auth: 'jwt',
      tags: ['api', 'leave-types'],
      description: 'Get all active leave types',
      notes: 'Returns all active leave types with their details including approval levels',
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Leave types retrieved successfully',
              schema: Joi.array().items(
                Joi.object({
                  id: Joi.number().required().description('Leave type ID'),
                  name: Joi.string().required().description('Leave type name'),
                  description: Joi.string().allow(null).description('Leave type description'),
                  maxDaysPerYear: Joi.number().required().description('Maximum days allowed per year'),
                  requiresApproval: Joi.boolean().required().description('Whether approval is required'),
                  approvalLevels: Joi.number().required().description('Number of approval levels (1=Manager only, 2=Manager+HR)'),
                  isActive: Joi.boolean().required().description('Whether the leave type is active')
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
      try {
        const leaveTypeRepo = AppDataSource.getRepository(LeaveType);
        
        const leaveTypes = await leaveTypeRepo.find({
          where: { isActive: true },
          order: { name: 'ASC' }
        });

        return h.response(leaveTypes).code(200);
      } catch (error) {
        console.error('Error fetching leave types:', error);
        return h.response({ 
          message: 'Failed to fetch leave types',
          error: error instanceof Error ? error.message : 'Unknown error'
        }).code(500);
      }
    }
  },

  {
    method: 'GET',
    path: '/api/leave-types/{id}',
    options: {
      auth: 'jwt',
      tags: ['api', 'leave-types'],
      description: 'Get a specific leave type by ID',
      notes: 'Returns details of a specific leave type',
      validate: {
        params: Joi.object({
          id: Joi.number().required().description('Leave type ID')
        })
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Leave type retrieved successfully',
              schema: Joi.object({
                id: Joi.number().required(),
                name: Joi.string().required(),
                description: Joi.string().allow(null),
                maxDaysPerYear: Joi.number().required(),
                requiresApproval: Joi.boolean().required(),
                approvalLevels: Joi.number().required(),
                isActive: Joi.boolean().required()
              })
            },
            '404': {
              description: 'Leave type not found',
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
        const leaveTypeId = Number(request.params.id);
        const leaveTypeRepo = AppDataSource.getRepository(LeaveType);
        
        const leaveType = await leaveTypeRepo.findOne({
          where: { id: leaveTypeId, isActive: true }
        });

        if (!leaveType) {
          return h.response({ message: 'Leave type not found' }).code(404);
        }

        return h.response(leaveType).code(200);
      } catch (error) {
        console.error('Error fetching leave type:', error);
        return h.response({ 
          message: 'Failed to fetch leave type',
          error: error instanceof Error ? error.message : 'Unknown error'
        }).code(500);
      }
    }
  },

  {
    method: 'POST',
    path: '/api/leave-types',
    options: {
      auth: 'jwt',
      tags: ['api', 'leave-types'],
      description: 'Create a new leave type',
      notes: 'Creates a new leave type. Requires Admin or HR role.',
      validate: {
        payload: Joi.object({
          name: Joi.string().required().description('Leave type name'),
          description: Joi.string().allow('').description('Leave type description'),
          maxDaysPerYear: Joi.number().min(0).required().description('Maximum days per year (0 for unlimited)'),
          requiresApproval: Joi.boolean().default(true).description('Whether approval is required'),
          approvalLevels: Joi.number().valid(1, 2).default(1).description('Number of approval levels'),
          isActive: Joi.boolean().default(true).description('Whether the leave type is active'),
          carryForwardAllowed: Joi.boolean().default(false).description('Whether carry forward is allowed'),
          maxCarryForward: Joi.number().min(0).default(0).description('Maximum days that can be carried forward')
        })
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '201': {
              description: 'Leave type created successfully',
              schema: Joi.object({
                id: Joi.number().required(),
                name: Joi.string().required(),
                description: Joi.string().allow(null),
                maxDaysPerYear: Joi.number().required(),
                requiresApproval: Joi.boolean().required(),
                approvalLevels: Joi.number().required(),
                isActive: Joi.boolean().required()
              })
            },
            '403': {
              description: 'Unauthorized - Admin/HR access required',
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
        
        // Check if user has admin privileges
        if (userRole !== 'Admin' && userRole !== 'HR') {
          return h.response({ message: 'Admin or HR access required' }).code(403);
        }

        const leaveTypeRepo = AppDataSource.getRepository(LeaveType);
        const leaveTypeData = request.payload as any;
        
        const leaveType = leaveTypeRepo.create(leaveTypeData);
        const savedLeaveType = await leaveTypeRepo.save(leaveType);

        return h.response(savedLeaveType).code(201);
      } catch (error) {
        console.error('Error creating leave type:', error);
        return h.response({ 
          message: 'Failed to create leave type',
          error: error instanceof Error ? error.message : 'Unknown error'
        }).code(500);
      }
    }
  },

  {
    method: 'PUT',
    path: '/api/leave-types/{id}',
    options: {
      auth: 'jwt',
      tags: ['api', 'leave-types'],
      description: 'Update a leave type',
      notes: 'Updates an existing leave type. Requires Admin or HR role.',
      validate: {
        params: Joi.object({
          id: Joi.number().required().description('Leave type ID')
        }),
        payload: Joi.object({
          name: Joi.string().description('Leave type name'),
          description: Joi.string().allow('').description('Leave type description'),
          maxDaysPerYear: Joi.number().min(0).description('Maximum days per year'),
          requiresApproval: Joi.boolean().description('Whether approval is required'),
          approvalLevels: Joi.number().valid(1, 2).description('Number of approval levels'),
          isActive: Joi.boolean().description('Whether the leave type is active'),
          carryForwardAllowed: Joi.boolean().description('Whether carry forward is allowed'),
          maxCarryForward: Joi.number().min(0).description('Maximum days that can be carried forward')
        })
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Leave type updated successfully',
              schema: Joi.object({
                message: Joi.string().required()
              })
            },
            '403': {
              description: 'Unauthorized - Admin/HR access required',
              schema: Joi.object({
                message: Joi.string().required()
              })
            },
            '404': {
              description: 'Leave type not found',
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
        
        // Check if user has admin privileges
        if (userRole !== 'Admin' && userRole !== 'HR') {
          return h.response({ message: 'Admin or HR access required' }).code(403);
        }

        const leaveTypeId = Number(request.params.id);
        const updateData = request.payload as any;
        const leaveTypeRepo = AppDataSource.getRepository(LeaveType);
        
        const leaveType = await leaveTypeRepo.findOne({ where: { id: leaveTypeId } });
        if (!leaveType) {
          return h.response({ message: 'Leave type not found' }).code(404);
        }

        await leaveTypeRepo.update(leaveTypeId, updateData);

        return h.response({ message: 'Leave type updated successfully' }).code(200);
      } catch (error) {
        console.error('Error updating leave type:', error);
        return h.response({ 
          message: 'Failed to update leave type',
          error: error instanceof Error ? error.message : 'Unknown error'
        }).code(500);
      }
    }
  }
];

export default leaveTypeRoutes;