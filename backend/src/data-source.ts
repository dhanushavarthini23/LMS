import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Employee } from './entities/Employee';
import { LeaveRequest } from './entities/LeaveRequest';
import { Approval } from './entities/Approval';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432, 
  username: 'postgres',
  password: 'Dhanusha@23',
  database: 'leave_management',
  synchronize: true, 
  logging: false,
  entities: [Employee, LeaveRequest, Approval],
  migrations: [],
  subscribers: [],
});

export default AppDataSource;
