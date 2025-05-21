import { ServerRoute } from '@hapi/hapi';
import {
  getEmployeeDashboardData,
  getManagerDashboardData,
  getHRDashboardData,
} from '../services/dashboardService';

const dashboardRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/api/dashboard',
    options: {
      auth: 'jwt',
      description: 'Get dashboard data based on user role',
    },
    handler: async (request, h) => {
      try {
        const userId = (request.auth.credentials as any).id;
        const role = (request.auth.credentials as any).role;
        
        console.log(`Dashboard request from user ${userId} with role ${role}`);
        
        if (role === 'Employee') {
          try {
            const leaveRequests = await getEmployeeDashboardData(userId);
            console.log(`Employee dashboard data: ${leaveRequests.length} leave requests`);
            
            return h.response({
              leaveRequests: leaveRequests,
              success: true
            }).code(200);
          } catch (error) {
            console.error('Error in employee dashboard:', error);
            return h.response({
              leaveRequests: [],
              success: false,
              error: 'Failed to load dashboard data'
            }).code(200);
          }
        }
        
        if (role === 'Manager') {
          try {
            const data = await getManagerDashboardData(userId);
            console.log('Manager dashboard data:', data);
            
            return h.response({
              managerDashboardData: data,
              pendingRequests: data.pendingRequests,
              teamMembers: data.teamMembers,
              approvedThisMonth: data.approvedThisMonth,
              success: true
            }).code(200);
          } catch (error) {
            console.error('Error in manager dashboard:', error);
            return h.response({
              managerDashboardData: {
                pendingRequests: [],
                teamMembers: [],
                approvedThisMonth: 0
              },
              pendingRequests: [],
              teamMembers: [],
              approvedThisMonth: 0,
              success: false,
              error: 'Failed to load dashboard data'
            }).code(200);
          }
        }
        
        if (role === 'HR') {
          try {
            const data = await getHRDashboardData();
            console.log('HR dashboard data:', data);
            
            return h.response({
              hrDashboardData: data,
              allRequests: data.allRequests,
              allEmployees: data.allEmployees,
              pendingRequests: data.pendingRequests,
              approvedThisMonth: data.approvedThisMonth,
              success: true
            }).code(200);
          } catch (error) {
            console.error('Error in HR dashboard:', error);
            return h.response({
              hrDashboardData: {
                allRequests: [],
                allEmployees: [],
                pendingRequests: [],
                approvedThisMonth: 0
              },
              allRequests: [],
              allEmployees: [],
              pendingRequests: [],
              approvedThisMonth: 0,
              success: false,
              error: 'Failed to load dashboard data'
            }).code(200);
          }
        }
        
        return h.response({
          success: false,
          error: 'Role not recognized'
        }).code(400);
      } catch (error) {
        console.error('Unexpected error in dashboard route:', error);
        return h.response({
          success: false,
          error: 'An unexpected error occurred'
        }).code(500);
      }
    }
  }
];

export default dashboardRoutes;