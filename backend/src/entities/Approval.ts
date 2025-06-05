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
  approver!: Employee; 

  @Column()
  level!: string;  

  @Column({
    type: 'enum',
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending', 
  })
  status!: 'Pending' | 'Approved' | 'Rejected';  
  
  @CreateDateColumn()
  approvalDate!: Date;
  
}
