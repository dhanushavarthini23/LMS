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
import { Department } from './Department'; // Import Department

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  role!: 'Employee' | 'Manager' | 'HR' | 'Admin';
  
  @Column({ type: 'int', default: 20, name: 'annual_leave_balance' })
  annualLeaveBalance!: number;
  
  @Column({ type: 'int', default: 10, name: 'sick_leave_balance' })
  sickLeaveBalance!: number;
  
  @Column({ type: 'int', default: 5, name: 'personal_leave_balance' })
  personalLeaveBalance!: number;

  @Column({ nullable: true })
  username?: string;
  
  @Column({ nullable: true })  
  password!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ type: 'jsonb', nullable: true })
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };           

  @ManyToOne(() => Department, (department) => department.employees, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department!: Department;

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
