import AppDataSource from './data-source';
import { Employee } from './entities/Employee';
import { LeaveRequest } from './entities/LeaveRequest';
import { Approval } from './entities/Approval';

async function seed() {
  await AppDataSource.initialize();
  console.log('Data Source has been initialized.');

  await AppDataSource.synchronize();

  const employees: Employee[] = [];

  const hr = new Employee();
  hr.name = 'Helen HR';
  hr.email = 'hr@example.com'; 
  hr.role = 'HR';
  employees.push(hr);

  const manager1 = new Employee();
  manager1.name = 'Mike Manager';
  manager1.email = 'manager1@example.com';  
  manager1.role = 'Manager';
  employees.push(manager1);

  const manager2 = new Employee();
  manager2.name = 'Sarah Manager';
  manager2.email = 'manager2@example.com';
  manager2.role = 'Manager';
  employees.push(manager2);

  const employeeNames = [
    'John Doe', 'Alice Brown', 'Bob White', 'Charlie Green', 'Diana Black',
    'Eve Adams', 'Frank Clark', 'Grace Lewis', 'Henry Scott'
  ];

  for (let i = 0; i < 9; i++) {
    const emp = new Employee();
    emp.name = employeeNames[i];
    emp.email = `employee${i + 1}@example.com`;  
    emp.role = 'Employee';

    emp.manager = i < 5 ? manager1 : manager2; 
    employees.push(emp);
  }

  await AppDataSource.manager.save(employees);
  console.log('10 employees saved');

  const leaveRequests: LeaveRequest[] = [];

  for (let i = 3; i <= 5; i++) { 
    const leave = new LeaveRequest();
    leave.employee = employees[i];
    leave.manager = manager1; 
    leave.startDate = new Date(`2025-05-${10 + i}`);
    leave.endDate = new Date(`2025-05-${11 + i}`);
    leave.reason = `Personal leave by ${employees[i].name}`;
    leave.status = 'Pending';

    await AppDataSource.manager.save(leave);
    leaveRequests.push(leave);
    console.log(`LeaveRequest for ${employees[i].name} saved`);

    //approvals for the leave request
    const approval1 = new Approval();
    approval1.leaveRequest = leave;
    approval1.approver = manager1;
    approval1.level = 'manager';
    approval1.status = 'Pending'; 

    const approval2 = new Approval();
    approval2.leaveRequest = leave;
    approval2.approver = hr;
    approval2.level = 'hr';
    approval2.status = 'Pending'; 

    await AppDataSource.manager.save([approval1, approval2]);
    console.log(`Approvals for ${employees[i].name} saved`);
  }

  // connection
  await AppDataSource.destroy();
  console.log('Seeding complete.');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
});
