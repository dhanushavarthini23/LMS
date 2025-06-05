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
  hr.phone = '+1-555-0101';
  hr.address = '123 Main St, New York, NY 10001';
  hr.emergencyContact = {
    name: 'Robert HR',
    relationship: 'Spouse',
    phone: '+1-555-0102'
  };
  employees.push(hr);

  const manager1 = new Employee();
  manager1.name = 'Mike Manager';
  manager1.email = 'manager1@example.com';  
  manager1.role = 'Manager';
  manager1.phone = '+1-555-0201';
  manager1.address = '456 Oak Ave, Los Angeles, CA 90210';
  manager1.emergencyContact = {
    name: 'Lisa Manager',
    relationship: 'Wife',
    phone: '+1-555-0202'
  };
  employees.push(manager1);

  const manager2 = new Employee();
  manager2.name = 'Sarah Manager';
  manager2.email = 'manager2@example.com';
  manager2.role = 'Manager';
  manager2.phone = '+1-555-0301';
  manager2.address = '789 Pine St, Chicago, IL 60601';
  manager2.emergencyContact = {
    name: 'David Manager',
    relationship: 'Husband',
    phone: '+1-555-0302'
  };
  employees.push(manager2);

  const employeeData = [
    {
      name: 'John Doe',
      phone: '+1-555-1001',
      address: '101 Elm St, Boston, MA 02101',
      emergencyContact: { name: 'Jane Doe', relationship: 'Wife', phone: '+1-555-1002' }
    },
    {
      name: 'Alice Brown',
      phone: '+1-555-1101',
      address: '202 Maple Ave, Seattle, WA 98101',
      emergencyContact: { name: 'Bob Brown', relationship: 'Husband', phone: '+1-555-1102' }
    },
    {
      name: 'Bob White',
      phone: '+1-555-1201',
      address: '303 Cedar Rd, Denver, CO 80201',
      emergencyContact: { name: 'Carol White', relationship: 'Sister', phone: '+1-555-1202' }
    },
    {
      name: 'Charlie Green',
      phone: '+1-555-1301',
      address: '404 Birch Ln, Miami, FL 33101',
      emergencyContact: { name: 'David Green', relationship: 'Brother', phone: '+1-555-1302' }
    },
    {
      name: 'Diana Black',
      phone: '+1-555-1401',
      address: '505 Spruce Dr, Phoenix, AZ 85001',
      emergencyContact: { name: 'Emma Black', relationship: 'Mother', phone: '+1-555-1402' }
    },
    {
      name: 'Eve Adams',
      phone: '+1-555-1501',
      address: '606 Willow Way, Portland, OR 97201',
      emergencyContact: { name: 'Frank Adams', relationship: 'Father', phone: '+1-555-1502' }
    },
    {
      name: 'Frank Clark',
      phone: '+1-555-1601',
      address: '707 Poplar Pl, Austin, TX 78701',
      emergencyContact: { name: 'Grace Clark', relationship: 'Wife', phone: '+1-555-1602' }
    },
    {
      name: 'Grace Lewis',
      phone: '+1-555-1701',
      address: '808 Aspen Ave, Nashville, TN 37201',
      emergencyContact: { name: 'Henry Lewis', relationship: 'Husband', phone: '+1-555-1702' }
    },
    {
      name: 'Henry Scott',
      phone: '+1-555-1801',
      address: '909 Redwood Rd, San Diego, CA 92101',
      emergencyContact: { name: 'Ivy Scott', relationship: 'Wife', phone: '+1-555-1802' }
    }
  ];

  for (let i = 0; i < 9; i++) {
    const emp = new Employee();
    emp.name = employeeData[i].name;
    emp.email = `employee${i + 1}@example.com`;  
    emp.role = 'Employee';
    emp.phone = employeeData[i].phone;
    emp.address = employeeData[i].address;
    emp.emergencyContact = employeeData[i].emergencyContact;

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
