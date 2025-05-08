import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LeaveRequest } from './LeaveRequest';
import { Approval } from './Approval';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  role!: 'Employee' | 'Manager' | 'HR';

  @Column({ type: 'int', default: 20 })
  leaveBalance!: number;

  @Column({ nullable: true })
  username?: string;
  @Column({ nullable: true })  // Allow NULLs temporarily
  password!: string;           // Add password field

  @OneToMany(() => LeaveRequest, (leaveRequest) => leaveRequest.employee)
  leaveRequests!: LeaveRequest[];

  @OneToMany(() => Approval, (approval) => approval.approver)
  approvals!: Approval[];

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager?: Employee;

  @OneToMany(() => Employee, (employee) => employee.manager)
  subordinates?: Employee[];
}
