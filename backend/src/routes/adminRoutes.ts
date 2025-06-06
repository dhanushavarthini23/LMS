import { ServerRoute } from '@hapi/hapi';
import AppDataSource from '../data-source';
import { Employee } from '../entities/Employee';
import { LeaveRequest } from '../entities/LeaveRequest';
import { Department } from '../entities/Department';
import { LeaveType } from '../entities/LeaveType';
import * as Joi from 'joi';
import logger from '../utils/logger';

const adminRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/api/admin/stats',
    options: {
      auth: 'jwt',
      tags: ['api', 'admin'],
      description: 'Get system statistics for admin dashboard',
      notes: 'Returns comprehensive system statistics including employee counts, leave requests, etc.',
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'System statistics retrieved successfully',
              schema: Joi.object({
                totalEmployees: Joi.number().required(),
                activeEmployees: Joi.number().required(),
                inactiveEmployees: Joi.number().required(),
                totalDepartments: Joi.number().required(),
                totalLeaveTypes: Joi.number().required(),
                pendingLeaveRequests: Joi.number().required(),
                approvedLeaveRequests: Joi.number().required(),
                rejectedLeaveRequests: Joi.number().required(),
                totalLeaveRequests: Joi.number().required(),
                recentLeaveRequests: Joi.array().items(Joi.object()),
                employeesByRole: Joi.object(),
                leaveRequestsByStatus: Joi.object()
              })
            },
            '403': {
              description: 'Unauthorized - Admin access required',
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
          return h.response({ message: 'Admin access required' }).code(403);
        }

        const employeeRepo = AppDataSource.getRepository(Employee);
        const leaveRequestRepo = AppDataSource.getRepository(LeaveRequest);
        const departmentRepo = AppDataSource.getRepository(Department);
        const leaveTypeRepo = AppDataSource.getRepository(LeaveType);
        const totalEmployees = await employeeRepo.count();
        const activeEmployees = await employeeRepo.count({ where: { isActive: true } });
        const inactiveEmployees = totalEmployees - activeEmployees;

        
        const totalDepartments = await departmentRepo.count({ where: { isActive: true } });
        const totalLeaveTypes = await leaveTypeRepo.count({ where: { isActive: true } });
        const totalLeaveRequests = await leaveRequestRepo.count();
        const pendingLeaveRequests = await leaveRequestRepo.count({ where: { status: 'Pending' } });
        const approvedLeaveRequests = await leaveRequestRepo.count({ where: { status: 'Approved' } });
        const rejectedLeaveRequests = await leaveRequestRepo.count({ where: { status: 'Rejected' } });

        const recentLeaveRequests = await leaveRequestRepo.find({
          relations: ['employee', 'employee.department'],
          order: { createdAt: 'DESC' },
          take: 10
        });

        // Get employees by role
        const employeesByRole = await employeeRepo
          .createQueryBuilder('employee')
          .select('employee.role', 'role')
          .addSelect('COUNT(*)', 'count')
          .where('employee.isActive = :isActive', { isActive: true })
          .groupBy('employee.role')
          .getRawMany();

        const roleStats = employeesByRole.reduce((acc, item) => {
          acc[item.role] = parseInt(item.count);
          return acc;
        }, {});

        // Get leave requests by status
        const leaveRequestsByStatus = await leaveRequestRepo
          .createQueryBuilder('leaveRequest')
          .select('leaveRequest.status', 'status')
          .addSelect('COUNT(*)', 'count')
          .groupBy('leaveRequest.status')
          .getRawMany();

        const statusStats = leaveRequestsByStatus.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {});

        const stats = {
          totalEmployees,
          activeEmployees,
          inactiveEmployees,
          totalDepartments,
          totalLeaveTypes,
          pendingLeaveRequests,
          approvedLeaveRequests,
          rejectedLeaveRequests,
          totalLeaveRequests,
          recentLeaveRequests: recentLeaveRequests.map(req => ({
            id: req.id,
            employeeName: req.employee?.name,
            department: req.employee?.department?.name,
            startDate: req.startDate,
            endDate: req.endDate,
            status: req.status,
            reason: req.reason,
            createdAt: req.createdAt
          })),
          employeesByRole: roleStats,
          leaveRequestsByStatus: statusStats
        };

        return h.response(stats).code(200);
      } catch (error) {
        logger.error('Error fetching admin stats:', error);
        return h.response({ 
          message: 'Failed to fetch system statistics',
          error: error instanceof Error ? error.message : 'Unknown error'
        }).code(500);
      }
    }
  }
];

export default adminRoutes;