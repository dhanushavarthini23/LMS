import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Employee } from './Employee';
import { Approval } from './Approval';

@Entity('leave_requests')
export class LeaveRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager!: Employee | null;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date' })
  endDate!: Date;

  @Column()
  reason!: string;

  @Column({
    type: 'enum',
    enum: ['Pending', 'Manager Approved', 'Approved', 'Rejected'],
    default: 'Pending',
  })
  status!: 'Pending' | 'Manager Approved' | 'Approved' | 'Rejected';

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Approval, (approval) => approval.leaveRequest)
  approvals!: Approval[];
}
