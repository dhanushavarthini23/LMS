// services/dashboardService.ts
import { getRepository } from 'typeorm';
import { LeaveRequest } from '../entities/LeaveRequest';
import { Employee } from '../entities/Employee';
import AppDataSource from '../data-source'; 

// 1. Employee dashboard
export const getEmployeeDashboardData = async (userId: number) => {
  const leaveRepo = AppDataSource.getRepository(LeaveRequest);
  const leaveRequests = await leaveRepo.find({
    where: { employee: { id: userId } },
    order: { createdAt: 'DESC' },
  });
  return leaveRequests;
};

// 2. Manager dashboard
export const getManagerDashboardData = async (managerId: number) => {
  const leaveRepo = AppDataSource.getRepository(LeaveRequest);
  const leaveRequests = await leaveRepo.find({
    where: { manager: { id: managerId }, status: 'Pending' },
    relations: ['employee'],
    order: { createdAt: 'DESC' },
  });
  return leaveRequests;
};

// 3. HR dashboard
export const getHRDashboardData = async () => {
  const leaveRepo = AppDataSource.getRepository(LeaveRequest);
  const allRequests = await leaveRepo.find({
    relations: ['employee', 'approvals'],
    order: { createdAt: 'DESC' },
  });
  return allRequests;
};
