import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,CreateDateColumn } from 'typeorm';
import { LeaveRequest } from './LeaveRequest';
import { Employee } from './Employee';

@Entity('approvals')
export class Approval {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => LeaveRequest)
  @JoinColumn({ name: 'leave_request_id' })
  leaveRequest!: LeaveRequest;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'approver_id' })
  approver!: Employee;  // Manager or HR

  @Column()
  level!: string;  // 'manager' or 'hr'

  @Column({
    type: 'enum',
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',  // Default value
  })
  status!: 'Pending' | 'Approved' | 'Rejected';  // Enforcing status types
  @Column({ nullable: true })
  comments?: string; // Comments from the approver
  @CreateDateColumn()
  approvalDate!: Date;
  
}
