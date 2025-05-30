import { ServerRoute } from '@hapi/hapi';
import {
  getEmployees,
  createEmployee,
  getEmployeeProfile,
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
      auth: 'jwt',
      tags: ['api', 'employees'],
      description: 'Create a new employee',
      notes: 'Creates a new employee in the system. Requires HR role.',
      validate: {
        payload: Joi.object({
          name: Joi.string().required().description('Employee full name'),
          email: Joi.string().email().required().description('Employee email address'),
          password: Joi.string().required().description('Initial password for the employee'),
          role: Joi.string().valid('Employee', 'Manager', 'HR').required().description('Employee role'),
          managerId: Joi.number().allow(null).description('ID of the employee\'s manager'),
          department: Joi.string().allow(null).description('Employee department'),
          joiningDate: Joi.date().description('Date when employee joined the company')
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
    path: '/api/employees/{id}',
    options: {
      auth: 'jwt',
      tags: ['api', 'employees'],
      description: 'Get employee profile by ID',
      notes: 'Returns detailed information about a specific employee',
      validate: {
        params: Joi.object({
          id: Joi.number().required().description('Employee ID')
        })
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Employee profile',
              schema: Joi.object({
                id: Joi.number().required().description('Employee ID'),
                name: Joi.string().required().description('Employee full name'),
                email: Joi.string().required().description('Employee email address'),
                role: Joi.string().required().description('Employee role'),
                managerId: Joi.number().allow(null).description('ID of the employee\'s manager'),
                manager: Joi.object({
                  id: Joi.number(),
                  name: Joi.string(),
                  email: Joi.string()
                }).allow(null).description('Manager details'),
                department: Joi.string().allow(null).description('Employee department'),
                joiningDate: Joi.date().description('Date when employee joined the company'),
                leaveBalance: Joi.number().description('Current leave balance'),
                teamMembers: Joi.array().items(
                  Joi.object({
                    id: Joi.number(),
                    name: Joi.string(),
                    email: Joi.string()
                  })
                ).description('Team members (if employee is a manager)')
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
      handler: getEmployeeProfile
    },
  },
];

export default employeeRoutes;
