import { ServerRoute } from '@hapi/hapi';
import { getEmployees, createEmployee } from '../controllers/employeeController'; // Assuming controllers are defined as before

const employeeRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/api/employees',
    handler: getEmployees,  // Calls the getEmployees controller
  },
  {
    method: 'POST',
    path: '/api/employees',
    handler: createEmployee,  // Calls the createEmployee controller
  },
];

export default employeeRoutes;