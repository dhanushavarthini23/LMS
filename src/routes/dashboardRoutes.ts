import { ServerRoute } from '@hapi/hapi';
import {
    getEmployeeDashboardData,
    getManagerDashboardData,
    getHRDashboardData,
  } from '../services/dashboardService'; // Adjust path if needed
  
// This should be implemented according to the roles: Employee, Manager, HR
const dashboardRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/api/dashboard',
    handler: async (request, h) => {
      const userId = (request.auth.credentials as any).id;
      const role = (request.auth.credentials as any).role;
      
      // Based on role (Employee, Manager, HR), fetch relevant dashboard data
      if (role === 'Employee') {
        const leaveRequests = await getEmployeeDashboardData(userId);  // Implement for employee
        return h.response({ leaveRequests }).code(200);
      }
      
      if (role === 'Manager') {
        const managerDashboardData = await getManagerDashboardData(userId);  // Implement for manager
        return h.response({ managerDashboardData }).code(200);
      }
      
      if (role === 'HR') {
        const hrDashboardData = await getHRDashboardData();  // Implement for HR
        return h.response({ hrDashboardData }).code(200);
      }
      
      return h.response({ message: 'Role not recognized' }).code(400);
    },
  },
];

export default dashboardRoutes;
