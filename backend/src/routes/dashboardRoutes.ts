import { ServerRoute } from '@hapi/hapi';
import {
  getEmployeeDashboardData,
  getManagerDashboardData,
  getHRDashboardData,
} from '../services/dashboardService';
import * as Joi from 'joi';

const dashboardRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/api/dashboard',
    options: {
      auth: 'jwt',
      tags: ['api', 'dashboard'],
      description: 'Get dashboard data based on user role',
      notes: 'Returns different dashboard data depending on the authenticated user\'s role (Employee, Manager, or HR)',
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Dashboard data retrieved successfully',
              schema: Joi.object({
                // Employee response
                leaveRequests: Joi.array().items(
                  Joi.object({
                    id: Joi.number(),
                    startDate: Joi.date(),
                    endDate: Joi.date(),
                    status: Joi.string(),
                    leaveType: Joi.string(),
                    reason: Joi.string()
                  })
                ).description('Leave requests for employee dashboard'),
                
                // Manager response
                managerDashboardData: Joi.object({
                  pendingRequests: Joi.array().items(Joi.object()),
                  teamMembers: Joi.array().items(Joi.object()),
                  approvedThisMonth: Joi.number()
                }).description('Dashboard data for managers'),
                pendingRequests: Joi.array().items(Joi.object()),
                teamMembers: Joi.array().items(Joi.object()),
                approvedThisMonth: Joi.number(),
                
                // HR response
                hrDashboardData: Joi.object({
                  allRequests: Joi.array().items(Joi.object()),
                  allEmployees: Joi.array().items(Joi.object()),
                  pendingRequests: Joi.array().items(Joi.object()),
                  approvedThisMonth: Joi.number()
                }).description('Dashboard data for HR'),
                allRequests: Joi.array().items(Joi.object()),
                allEmployees: Joi.array().items(Joi.object()),
                
                // Common fields
                success: Joi.boolean().required(),
                error: Joi.string().optional()
              })
            },
            '400': {
              description: 'Bad request',
              schema: Joi.object({
                success: Joi.boolean().required().example(false),
                error: Joi.string().required().example('Role not recognized')
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
                success: Joi.boolean().required().example(false),
                error: Joi.string().required().example('An unexpected error occurred')
              })
            }
          }
        }
      },
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
        
        if (role === 'HR' || role === 'Admin') {
          try {
            const data = await getHRDashboardData();
            console.log(`${role} dashboard data:`, data);
            
            return h.response({
              hrDashboardData: data,
              allRequests: data.allRequests,
              allEmployees: data.allEmployees,
              pendingRequests: data.pendingRequests,
              approvedThisMonth: data.approvedThisMonth,
              success: true
            }).code(200);
          } catch (error) {
            console.error(`Error in ${role} dashboard:`, error);
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