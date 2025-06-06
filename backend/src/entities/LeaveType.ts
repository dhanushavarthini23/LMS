import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LeaveRequest } from './LeaveRequest';

@Entity('leave_types')
export class LeaveType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 50 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 0 })
  maxDaysPerYear!: number;

  @Column({ default: true })
  requiresApproval!: boolean;

  @Column({ type: 'int', default: 2 })
  approvalLevels!: number; // 1 = Manager only, 2 = Manager + HR

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  carryForwardAllowed!: boolean;

  @Column({ type: 'int', default: 0 })
  maxCarryForward!: number;

  @OneToMany(() => LeaveRequest, (leaveRequest) => leaveRequest.leaveType)
  leaveRequests!: LeaveRequest[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}