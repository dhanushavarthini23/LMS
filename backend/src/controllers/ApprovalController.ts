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
        relations: ['approvals', 'leaveType', 'employee'] 
      });
      
      if (!leave) {
        return h.response({ message: 'Leave request not found' }).code(404);
      }
      
      if (leave.status !== 'Pending') {
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
        status:       decision as 'Approved' | 'Rejected',
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
            
            // Update specific leave type balance
            if (leaveTypeName === 'Annual Leave' || leaveTypeName === 'Vacation') {
              employee.annualLeaveBalance = Math.max(0, employee.annualLeaveBalance - days);
            } else if (leaveTypeName === 'Sick Leave') {
              employee.sickLeaveBalance = Math.max(0, employee.sickLeaveBalance - days);
            } else if (leaveTypeName === 'Personal Leave') {
              employee.personalLeaveBalance = Math.max(0, employee.personalLeaveBalance - days);
            }
            
            await empRepo.save(employee);
          }
        } else {
          leave.status = 'Manager Approved';
        }
      } else {
        leave.status = 'Rejected';
      }
      await lrRepo.save(leave);

      const successMessage = decision === 'Approved' 
        ? (leave.leaveType.approvalLevels === 1 
            ? 'Leave fully approved by manager' 
            : 'Leave approved by manager; now pending HR')
        : 'Leave rejected by manager';

      return h
        .response({
          message: successMessage
        })
        .code(200);
    } catch (err) {
      logger.error('Error in manager approval:', err);
      return h.response({ message: 'Failed to process manager decision' }).code(500);
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
      
      if (!leave) {
        return h.response({ message: 'Leave request not found' }).code(404);
      }
      
      if (leave.status !== 'Manager Approved') {
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
        status:       decision as 'Approved' | 'Rejected',
      });
      leave.status = decision as 'Approved' | 'Rejected';
      await lrRepo.save(leave);

      if (decision === 'Approved') {
        const days =
          (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) /
            (1000 * 60 * 60 * 24) + 1;
        const employee = await empRepo.findOne({
          where: { id: leave.employee.id }
        });
        
        if (employee) {
          const leaveTypeName = leave.leaveType?.name || 'Annual Leave';
          
          // Update specific leave type balance
          if (leaveTypeName === 'Annual Leave' || leaveTypeName === 'Vacation') {
            employee.annualLeaveBalance = Math.max(0, employee.annualLeaveBalance - days);
          } else if (leaveTypeName === 'Sick Leave') {
            employee.sickLeaveBalance = Math.max(0, employee.sickLeaveBalance - days);
          } else if (leaveTypeName === 'Personal Leave') {
            employee.personalLeaveBalance = Math.max(0, employee.personalLeaveBalance - days);
          }
          
          await empRepo.save(employee);
        }
      }

      const successMessage = `Leave ${decision.toLowerCase()} by HR`;
      
      return h.response({ message: successMessage }).code(200);
    } catch (err) {
      logger.error('Error in HR approval:', err);
      return h.response({ message: 'Failed to process HR decision' }).code(500);
    }
  }
}