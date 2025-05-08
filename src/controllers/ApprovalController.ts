import { Request, ResponseToolkit } from '@hapi/hapi';
import AppDataSource from '../data-source';   // ← point at your TypeORM DataSource
import { LeaveRequest } from '../entities/LeaveRequest';
import { Approval }     from '../entities/Approval';
import { Employee }     from '../entities/Employee';

export class ApprovalController {
  // Manager-level decision
  static async managerDecision(req: Request, h: ResponseToolkit) {
    const lrId = Number(req.params.id);
    const { decision, comments } = req.payload as { decision: 'Approved' | 'Rejected'; comments?: string };
    const userId = (req.auth.credentials as any).id;

    const lrRepo  = AppDataSource.getRepository(LeaveRequest);
    const apRepo  = AppDataSource.getRepository(Approval);
    const empRepo = AppDataSource.getRepository(Employee);

    try {
      const leave = await lrRepo.findOne({ where: { id: lrId }, relations: ['approvals'] });
      if (!leave || leave.status !== 'Pending') {
        return h.response({ message: 'Leave request is not in Pending state' }).code(400);
      }

      const approver = await empRepo.findOneBy({ id: userId });
      if (!approver) {
        return h.response({ message: 'Approver not found' }).code(404);
      }

      // Save the approval decision
      await apRepo.save({
        leaveRequest: leave,
        approver:     approver,
        level:        'manager',
        status:       decision,
        comments,
      });

      // Update leave request status
      leave.status = decision === 'Approved' ? 'Manager Approved' : 'Rejected';
      await lrRepo.save(leave);

      return h
        .response({
          message: decision === 'Approved' 
            ? 'Leave approved by manager; now pending HR'
            : 'Leave rejected by manager'
        })
        .code(200);
    } catch (err) {
      console.error('Error in manager approval:', err);
      return h.response({ error: 'Failed to process manager decision' }).code(500);
    }
  }

  // HR-level decision
  static async hrDecision(req: Request, h: ResponseToolkit) {
    const lrId = Number(req.params.id);
    const { decision, comments } = req.payload as { decision: 'Approved' | 'Rejected'; comments?: string };
    const userId = (req.auth.credentials as any).id;

    const lrRepo  = AppDataSource.getRepository(LeaveRequest);
    const apRepo  = AppDataSource.getRepository(Approval);
    const empRepo = AppDataSource.getRepository(Employee);

    try {
      const leave = await lrRepo.findOne({
        where: { id: lrId },
        relations: ['approvals', 'employee'],
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
        comments,
      });

      // Update leave request status
      leave.status = decision;
      await lrRepo.save(leave);
      if (decision === 'Approved') {
        // Deduct leave balance if approved
        const days =
          (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) /
            (1000 * 60 * 60 * 24) + 1;
        leave.employee.leaveBalance -= days;
        await empRepo.save(leave.employee);
      }

      return h.response({ message: `Leave ${decision.toLowerCase()} by HR` }).code(200);
    } catch (err) {
      console.error('Error in HR approval:', err);
      return h.response({ error: 'Failed to process HR decision' }).code(500);
    }
  }
}
