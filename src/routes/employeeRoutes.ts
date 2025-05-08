import { ServerRoute } from '@hapi/hapi';
import {
  getEmployees,
  createEmployee,
  getEmployeeProfile,
} from '../controllers/employeeController';

const employeeRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/api/employees',
    handler: getEmployees,
    options: {
      auth: 'jwt' // Optional: enable if auth is in place
    },
  },
  {
    method: 'POST',
    path: '/api/employees',
    handler: createEmployee,
    options: {
      auth: 'jwt' // Optional: enable if only HR should add
    },
  },
  {
    method: 'GET',
    path: '/api/employees/{id}',
    handler: getEmployeeProfile,
    options: {
      auth: 'jwt' // Optional: restrict to self or manager
    },
  },
];

export default employeeRoutes;
