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
      auth: { mode: 'try' } // Allow both authenticated and unauthenticated requests
    },
  },
  {
    method: 'POST',
    path: '/api/employees',
    handler: createEmployee,
    options: {
      auth: 'jwt' 
    },
  },
  {
    method: 'GET',
    path: '/api/employees/{id}',
    handler: getEmployeeProfile,
    options: {
      auth: 'jwt' 
    },
  },
];

export default employeeRoutes;
