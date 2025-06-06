import { ServerRoute } from '@hapi/hapi';
import AppDataSource from '../data-source';
import { Department } from '../entities/Department';
import * as Joi from 'joi';

const departmentRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/api/departments',
    options: {
      auth: 'jwt',
      tags: ['api', 'departments'],
      description: 'Get departments',
      notes: 'Returns departments with their details. Admin and HR users see all departments, others see only active ones.',
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Departments retrieved successfully',
              schema: Joi.array().items(
                Joi.object({
                  id: Joi.number().required().description('Department ID'),
                  name: Joi.string().required().description('Department name'),
                  code: Joi.string().required().description('Department code'),
                  description: Joi.string().allow(null).description('Department description'),
                  isActive: Joi.boolean().required().description('Whether the department is active'),
                  employees: Joi.array().description('Employees in this department')
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
        const userRole = (request.auth.credentials as any).role;
        const departmentRepo = AppDataSource.getRepository(Department);
        
        // Admin and HR can see all departments, others only see active ones
        const whereCondition = (userRole === 'Admin' || userRole === 'HR') ? {} : { isActive: true };
        
        const departments = await departmentRepo.find({
          where: whereCondition,
          relations: ['employees'],
          order: { name: 'ASC' }
        });

        return h.response(departments).code(200);
      } catch (error) {
        console.error('Error fetching departments:', error);
        return h.response({ 
          message: 'Failed to fetch departments',
          error: error instanceof Error ? error.message : 'Unknown error'
        }).code(500);
      }
    }
  },

  {
    method: 'GET',
    path: '/api/departments/{id}',
    options: {
      auth: 'jwt',
      tags: ['api', 'departments'],
      description: 'Get a specific department by ID',
      notes: 'Returns details of a specific department including employees',
      validate: {
        params: Joi.object({
          id: Joi.number().required().description('Department ID')
        })
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Department retrieved successfully',
              schema: Joi.object({
                id: Joi.number().required(),
                name: Joi.string().required(),
                code: Joi.string().required(),
                description: Joi.string().allow(null),
                isActive: Joi.boolean().required(),
                employees: Joi.array().items(Joi.object())
              })
            },
            '404': {
              description: 'Department not found',
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
        const departmentId = Number(request.params.id);
        const departmentRepo = AppDataSource.getRepository(Department);
        
        const department = await departmentRepo.findOne({
          where: { id: departmentId, isActive: true },
          relations: ['employees']
        });

        if (!department) {
          return h.response({ message: 'Department not found' }).code(404);
        }

        return h.response(department).code(200);
      } catch (error) {
        console.error('Error fetching department:', error);
        return h.response({ 
          message: 'Failed to fetch department',
          error: error instanceof Error ? error.message : 'Unknown error'
        }).code(500);
      }
    }
  },

  {
    method: 'POST',
    path: '/api/departments',
    options: {
      auth: 'jwt',
      tags: ['api', 'departments'],
      description: 'Create a new department',
      notes: 'Creates a new department. Requires Admin or HR role.',
      validate: {
        payload: Joi.object({
          name: Joi.string().required().description('Department name'),
          description: Joi.string().allow('').description('Department description'),
          isActive: Joi.boolean().default(true).description('Whether the department is active')
        })
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '201': {
              description: 'Department created successfully',
              schema: Joi.object({
                id: Joi.number().required(),
                name: Joi.string().required(),
                description: Joi.string().allow(null),
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

        const departmentRepo = AppDataSource.getRepository(Department);
        const departmentData = request.payload as any;
        
        const department = departmentRepo.create(departmentData);
        const savedDepartment = await departmentRepo.save(department);

        return h.response(savedDepartment).code(201);
      } catch (error) {
        console.error('Error creating department:', error);
        return h.response({ 
          message: 'Failed to create department',
          error: error instanceof Error ? error.message : 'Unknown error'
        }).code(500);
      }
    }
  },

  {
    method: 'PUT',
    path: '/api/departments/{id}',
    options: {
      auth: 'jwt',
      tags: ['api', 'departments'],
      description: 'Update a department',
      notes: 'Updates an existing department. Requires Admin or HR role.',
      validate: {
        params: Joi.object({
          id: Joi.number().required().description('Department ID')
        }),
        payload: Joi.object({
          name: Joi.string().description('Department name'),
          description: Joi.string().allow('').description('Department description'),
          isActive: Joi.boolean().description('Whether the department is active')
        })
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Department updated successfully',
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
              description: 'Department not found',
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

        const departmentId = Number(request.params.id);
        const updateData = request.payload as any;
        const departmentRepo = AppDataSource.getRepository(Department);
        
        const department = await departmentRepo.findOne({ where: { id: departmentId } });
        if (!department) {
          return h.response({ message: 'Department not found' }).code(404);
        }

        await departmentRepo.update(departmentId, updateData);

        return h.response({ message: 'Department updated successfully' }).code(200);
      } catch (error) {
        console.error('Error updating department:', error);
        return h.response({ 
          message: 'Failed to update department',
          error: error instanceof Error ? error.message : 'Unknown error'
        }).code(500);
      }
    }
  }
];

export default departmentRoutes;