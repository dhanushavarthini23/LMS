import AppDataSource from '../data-source';
import { Employee } from '../entities/Employee';

export async function updateEmployeeContacts() {
  try {
    await AppDataSource.initialize();
    console.log('Updating employee contact information...');   
    const employeeRepo = AppDataSource.getRepository(Employee);
    const contactUpdates = [
      {
        email: 'hr@example.com',
        phone: '+1-555-0101',
        address: '123 Main St, New York, NY 10001',
        emergencyContact: { name: 'Robert HR', relationship: 'Spouse', phone: '+1-555-0102' }
      },
      {
        email: 'manager1@example.com',
        phone: '+1-555-0201',
        address: '456 Oak Ave, Los Angeles, CA 90210',
        emergencyContact: { name: 'Lisa Manager', relationship: 'Wife', phone: '+1-555-0202' }
      },
      {
        email: 'manager2@example.com',
        phone: '+1-555-0301',
        address: '789 Pine St, Chicago, IL 60601',
        emergencyContact: { name: 'David Manager', relationship: 'Husband', phone: '+1-555-0302' }
      },
      {
        email: 'employee1@example.com',
        phone: '+1-555-1001',
        address: '101 Elm St, Boston, MA 02101',
        emergencyContact: { name: 'Jane Doe', relationship: 'Wife', phone: '+1-555-1002' }
      },
      {
        email: 'employee2@example.com',
        phone: '+1-555-1101',
        address: '202 Maple Ave, Seattle, WA 98101',
        emergencyContact: { name: 'Bob Brown', relationship: 'Husband', phone: '+1-555-1102' }
      },
      {
        email: 'employee3@example.com',
        phone: '+1-555-1201',
        address: '303 Cedar Rd, Denver, CO 80201',
        emergencyContact: { name: 'Carol White', relationship: 'Sister', phone: '+1-555-1202' }
      },
      {
        email: 'employee4@example.com',
        phone: '+1-555-1301',
        address: '404 Birch Ln, Miami, FL 33101',
        emergencyContact: { name: 'David Green', relationship: 'Brother', phone: '+1-555-1302' }
      },
      {
        email: 'employee5@example.com',
        phone: '+1-555-1401',
        address: '505 Spruce Dr, Phoenix, AZ 85001',
        emergencyContact: { name: 'Emma Black', relationship: 'Mother', phone: '+1-555-1402' }
      },
      {
        email: 'employee6@example.com',
        phone: '+1-555-1501',
        address: '606 Willow Way, Portland, OR 97201',
        emergencyContact: { name: 'Frank Adams', relationship: 'Father', phone: '+1-555-1502' }
      },
      {
        email: 'employee7@example.com',
        phone: '+1-555-1601',
        address: '707 Poplar Pl, Austin, TX 78701',
        emergencyContact: { name: 'Grace Clark', relationship: 'Wife', phone: '+1-555-1602' }
      },
      {
        email: 'employee8@example.com',
        phone: '+1-555-1701',
        address: '808 Aspen Ave, Nashville, TN 37201',
        emergencyContact: { name: 'Henry Lewis', relationship: 'Husband', phone: '+1-555-1702' }
      },
      {
        email: 'employee9@example.com',
        phone: '+1-555-1801',
        address: '909 Redwood Rd, San Diego, CA 92101',
        emergencyContact: { name: 'Ivy Scott', relationship: 'Wife', phone: '+1-555-1802' }
      },
      {
        email: 'admin@company.com',
        phone: '+1-555-0001',
        address: '1 Corporate Plaza, New York, NY 10001',
        emergencyContact: { name: 'Admin Emergency', relationship: 'Contact', phone: '+1-555-0002' }
      }
    ];

    for (const update of contactUpdates) {
      const employee = await employeeRepo.findOne({ where: { email: update.email } });
      if (employee) {
        employee.phone = update.phone;
        employee.address = update.address;
        employee.emergencyContact = update.emergencyContact;
        await employeeRepo.save(employee);
      } else {
        console.log(`Employee not found: ${update.email}`);
      }
    }

    console.log('Employee contact information updated successfully!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error updating employee contacts:', error);
    await AppDataSource.destroy();
  }
}
if (require.main === module) {
  updateEmployeeContacts();
}