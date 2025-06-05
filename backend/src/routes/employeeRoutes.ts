import { ServerRoute } from '@hapi/hapi';
import {
  getEmployees,
  createEmployee,
  getEmployeeProfile,
  updateEmployeeProfile,
} from '../controllers/employeeController';
import Joi from 'joi';

const employeeRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/api/employees',
    options: {
      auth: { mode: 'try' },
      tags: ['api', 'employees'],
      description: 'Get all employees',
      notes: 'Returns a list of all employees in the system',
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'List of employees',
              schema: Joi.array().items(
                Joi.object({
                  id: Joi.number().required().description('Employee ID'),
                  name: Joi.string().required().description('Employee full name'),
                  email: Joi.string().required().description('Employee email address'),
                  role: Joi.string().required().description('Employee role (Employee, Manager, HR)'),
                  managerId: Joi.number().allow(null).description('ID of the employee\'s manager'),
                  department: Joi.string().allow(null).description('Employee department'),
                  joiningDate: Joi.date().description('Date when employee joined the company')
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
      },
      handler: getEmployees
    },
  },
  {
    method: 'POST',
    path: '/api/employees',
    options: {
      auth: { mode: 'try' },
      tags: ['api', 'employees'],
      description: 'Create a new employee',
      notes: 'Creates a new employee in the system. If authenticated as Manager, the new employee will be assigned to that manager.',
      validate: {
        payload: Joi.object({
          name: Joi.string().min(3).required().description('Employee full name'),
          email: Joi.string().email().required().description('Employee email address'),
          role: Joi.string().valid('Employee', 'Manager', 'HR', 'Admin').required().description('Employee role'),
          username: Joi.string().min(3).optional().description('Username (defaults to email prefix if not provided)'),
          password: Joi.string().min(6).optional().description('Initial password (defaults to "password123" if not provided)'),
          department: Joi.string().valid('IT', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales', 'Engineering', 'Customer Support').required().description('Employee department')
        })
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '201': {
              description: 'Employee created successfully',
              schema: Joi.object({
                id: Joi.number().required().description('New employee ID'),
                name: Joi.string().required(),
                email: Joi.string().required(),
                role: Joi.string().required(),
                managerId: Joi.number().allow(null),
                department: Joi.string().allow(null),
                joiningDate: Joi.date()
              })
            },
            '400': {
              description: 'Bad request',
              schema: Joi.object({
                message: Joi.string().required()
              })
            },
            '401': {
              description: 'Unauthorized',
              schema: Joi.object({
                message: Joi.string().required().example('Unauthorized')
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
      },
      handler: createEmployee
    },
  },
  {
    method: 'GET',
    path: '/api/employees/profile',
    options: {
      auth: 'jwt',
      tags: ['api', 'employees'],
      description: 'Get current user profile',
      notes: 'Returns detailed information about the authenticated employee',
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Employee profile',
              schema: Joi.object({
                id: Joi.number().required().description('Employee ID'),
                name: Joi.string().required().description('Employee full name'),
                email: Joi.string().required().description('Employee email address'),
                username: Joi.string().required().description('Employee username'),
                role: Joi.string().required().description('Employee role'),
                department: Joi.string().required().description('Employee department'),
                manager: Joi.object({
                  id: Joi.number(),
                  name: Joi.string(),
                  email: Joi.string()
                }).allow(null).description('Manager details'),
                createdAt: Joi.date().description('Account creation date'),
                updatedAt: Joi.date().description('Last update date')
              })
            },
            '404': {
              description: 'Employee not found',
              schema: Joi.object({
                error: Joi.string().required().example('Employee not found')
              })
            },
            '500': {
              description: 'Server error',
              schema: Joi.object({
                error: Joi.string().required().example('Server error')
              })
            }
          }
        }
      },
      handler: getEmployeeProfile
    },
  },
  {
    method: 'PUT',
    path: '/api/employees/profile',
    options: {
      auth: 'jwt',
      tags: ['api', 'employees'],
      description: 'Update employee profile',
      notes: 'Updates the authenticated employee\'s profile information',
      validate: {
        payload: Joi.object({
          name: Joi.string().optional().description('Employee full name'),
          email: Joi.string().email().optional().description('Employee email address'),
          phone: Joi.string().optional().description('Employee phone number'),
          address: Joi.string().optional().description('Employee address'),
          emergencyContact: Joi.object({
            name: Joi.string().optional(),
            relationship: Joi.string().optional(),
            phone: Joi.string().optional()
          }).optional().description('Emergency contact information'),
          password: Joi.string().min(6).optional().description('New password (optional)')
        })
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Profile updated successfully',
              schema: Joi.object({
                message: Joi.string().required().example('Profile updated successfully'),
                employee: Joi.object().description('Updated employee information')
              })
            },
            '404': {
              description: 'Employee not found',
              schema: Joi.object({
                error: Joi.string().required().example('Employee not found')
              })
            },
            '500': {
              description: 'Server error',
              schema: Joi.object({
                error: Joi.string().required().example('Server error')
              })
            }
          }
        }
      },
      handler: updateEmployeeProfile
    },
  },
  {
    method: 'PUT',
    path: '/api/employees/{id}/status',
    options: {
      auth: 'jwt',
      tags: ['api', 'employees'],
      description: 'Update employee status (activate/deactivate)',
      notes: 'Allows admins to activate or deactivate employees. Deactivated employees cannot log in or request leave.',
      validate: {
        params: Joi.object({
          id: Joi.number().required().description('Employee ID')
        }),
        payload: Joi.object({
          isActive: Joi.boolean().required().description('Employee active status')
        })
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Employee status updated successfully',
              schema: Joi.object({
                message: Joi.string().required().example('Employee status updated successfully')
              })
            },
            '403': {
              description: 'Unauthorized - Admin access required',
              schema: Joi.object({
                message: Joi.string().required().example('Admin access required')
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
      },
      handler: async (request, h) => {
        try {
          const { id } = request.params as { id: number };
          const { isActive } = request.payload as { isActive: boolean };
          const userRole = (request.auth.credentials as any).role;

          // Check if user has admin privileges
          if (userRole !== 'Admin' && userRole !== 'HR') {
            return h.response({ message: 'Admin access required' }).code(403);
          }

          const employeeRepo = (request.server.app as any).dataSource.getRepository('Employee');
          
          const employee = await employeeRepo.findOne({ where: { id } });
          if (!employee) {
            return h.response({ message: 'Employee not found' }).code(404);
          }

          // Update employee status
          await employeeRepo.update(id, { isActive });

          return h.response({ 
            message: `Employee ${isActive ? 'activated' : 'deactivated'} successfully` 
          }).code(200);
        } catch (error) {
          console.error('Error updating employee status:', error);
          return h.response({ message: 'Server error' }).code(500);
        }
      }
    },
  },
];

export default employeeRoutes;
