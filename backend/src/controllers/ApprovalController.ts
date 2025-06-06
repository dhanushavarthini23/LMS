import { Request, ResponseToolkit } from '@hapi/hapi';
import AppDataSource from '../data-source';  
import { LeaveRequest } from '../entities/LeaveRequest';
import { Approval }     from '../entities/Approval';
import { Employee }     from '../entities/Employee';
import logger from '../utils/logger';

export class ApprovalController {
  static async managerDecision(req: Request, h: ResponseToolkit) {
    const lrId = Number(req.params.id);
    const { decision: decisionAction } = req.payload as { decision: string };
    const decision = decisionAction === 'approve' ? 'Approved' : 'Rejected';
    const userId = (req.auth.credentials as any).id;

    const lrRepo  = AppDataSource.getRepository(LeaveRequest);
    const apRepo  = AppDataSource.getRepository(Approval);
    const empRepo = AppDataSource.getRepository(Employee);

    try {
      const leave = await lrRepo.findOne({ 
        where: { id: lrId }, 
        relations: ['approvals', 'leaveType'] 
      });
      if (!leave || leave.status !== 'Pending') {
        return h.response({ message: 'Leave request is not in Pending state' }).code(400);
      }

      const approver = await empRepo.findOneBy({ id: userId });
      if (!approver) {
        return h.response({ message: 'Approver not found' }).code(404);
      }
      await apRepo.save({
        leaveRequest: leave,
        approver:     approver,
        level:        'manager',
        status:       decision,
      });
      if (decision === 'Approved') {
        if (leave.leaveType.approvalLevels === 1) {
          leave.status = 'Approved';
          
          
          const days =
            (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) /
              (1000 * 60 * 60 * 24) + 1;
          const employee = await empRepo.findOne({
            where: { id: leave.employee.id }
          });
          
          if (employee) {
            
            const leaveTypeName = leave.leaveType?.name || 'Annual Leave';
            
            logger.info(`Manager directly approving: Updating leave balance for ${leaveTypeName} - deducting ${days} days`);
            
            // Update specific leave type balance
            if (leaveTypeName === 'Annual Leave' || leaveTypeName === 'Vacation') {
              employee.annualLeaveBalance = Math.max(0, employee.annualLeaveBalance - days);
              logger.info(`Updated annual leave balance to ${employee.annualLeaveBalance}`);
            } else if (leaveTypeName === 'Sick Leave') {
              employee.sickLeaveBalance = Math.max(0, employee.sickLeaveBalance - days);
              logger.info(`Updated sick leave balance to ${employee.sickLeaveBalance}`);
            } else if (leaveTypeName === 'Personal Leave') {
              employee.personalLeaveBalance = Math.max(0, employee.personalLeaveBalance - days);
              logger.info(`Updated personal leave balance to ${employee.personalLeaveBalance}`);
            }
            
            await empRepo.save(employee);
            logger.info(`Employee leave balances updated successfully by manager approval`);
          }
        } else {
          leave.status = 'Manager Approved';
        }
      } else {
        leave.status = 'Rejected';
      }
      await lrRepo.save(leave);

      return h
        .response({
          message: decision === 'Approved' 
            ? (leave.leaveType.approvalLevels === 1 
                ? 'Leave fully approved by manager' 
                : 'Leave approved by manager; now pending HR')
            : 'Leave rejected by manager'
        })
        .code(200);
    } catch (err) {
      logger.error('Error in manager approval:', err);
      return h.response({ error: 'Failed to process manager decision' }).code(500);
    }
  }

  // HR-level decision
  static async hrDecision(req: Request, h: ResponseToolkit) {
    const lrId = Number(req.params.id);
    const { decision: decisionAction } = req.payload as { decision: string };
    const decision = decisionAction === 'approve' ? 'Approved' : 'Rejected';
    const userId = (req.auth.credentials as any).id;

    const lrRepo  = AppDataSource.getRepository(LeaveRequest);
    const apRepo  = AppDataSource.getRepository(Approval);
    const empRepo = AppDataSource.getRepository(Employee);

    try {
      const leave = await lrRepo.findOne({
        where: { id: lrId },
        relations: ['approvals', 'employee', 'leaveType'],
      });
      if (!leave || leave.status !== 'Manager Approved') {
        return h.response({ message: 'Leave request not ready for HR review' }).code(400);
      }

      const approver = await empRepo.findOneBy({ id: userId });
      if (!approver) {
        return h.response({ message: 'Approver not found' }).code(404);
      }

      // Save the HR decision
      await apRepo.save({
        leaveRequest: leave,
        approver:     approver,
        level:        'hr',
        status:       decision,
      });
      leave.status = decision;
      await lrRepo.save(leave);
      if (decision === 'Approved') {
        const days =
          (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) /
            (1000 * 60 * 60 * 24) + 1;
        const leaveTypeName = leave.leaveType?.name || 'Annual Leave';
        
        logger.info(`Updating leave balance for ${leaveTypeName} - deducting ${days} days`);
        
        // Update specific leave type balance
        if (leaveTypeName === 'Annual Leave' || leaveTypeName === 'Vacation') {
          leave.employee.annualLeaveBalance = Math.max(0, leave.employee.annualLeaveBalance - days);
          logger.info(`Updated annual leave balance to ${leave.employee.annualLeaveBalance}`);
        } else if (leaveTypeName === 'Sick Leave') {
          leave.employee.sickLeaveBalance = Math.max(0, leave.employee.sickLeaveBalance - days);
          logger.info(`Updated sick leave balance to ${leave.employee.sickLeaveBalance}`);
        } else if (leaveTypeName === 'Personal Leave') {
          leave.employee.personalLeaveBalance = Math.max(0, leave.employee.personalLeaveBalance - days);
          logger.info(`Updated personal leave balance to ${leave.employee.personalLeaveBalance}`);
        }
        
        await empRepo.save(leave.employee);
        logger.info(`Employee leave balances updated successfully`);
      }

      return h.response({ message: `Leave ${decision.toLowerCase()} by HR` }).code(200);
    } catch (err) {
      logger.error('Error in HR approval:', err);
      return h.response({ error: 'Failed to process HR decision' }).code(500);
    }
  }
}
