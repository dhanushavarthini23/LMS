import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Employee } from './Employee';

@Entity('delegations')
export class Delegation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'manager_id' })
  manager!: Employee;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'delegate_id' })
  delegate!: Employee;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date' })
  endDate!: Date;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ 
    type: 'enum', 
    enum: ['Pending', 'Active', 'Completed', 'Cancelled'],
    default: 'Pending'
  })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}