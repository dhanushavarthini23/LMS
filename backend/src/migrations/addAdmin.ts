import bcrypt from 'bcrypt';
import AppDataSource from '../data-source';
import { Employee } from '../entities/Employee';

const addAdminUser = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized.');

    const employeeRepo = AppDataSource.getRepository(Employee);

    // Check if admin already exists
    const existingAdmin = await employeeRepo.findOne({
      where: { email: 'admin@company.com' }
    });

    if (existingAdmin) {
      
      await AppDataSource.destroy();
      return;
    }

    // Hash the password
    const saltRounds = 10;
    const plainPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    // Create admin user
    const admin = new Employee();
    admin.name = 'System Administrator';
    admin.email = 'admin@company.com';
    admin.username = 'admin';
    admin.password = hashedPassword;
    admin.role = 'Admin';
    admin.isActive = true;
    admin.annualLeaveBalance = 25;
    admin.sickLeaveBalance = 15;
    admin.personalLeaveBalance = 10;

    await employeeRepo.save(admin);


    // console.log('Username: admin');
    // console.log('Password: admin123');
    // console.log('Email: admin@company.com');
    // console.log('Role: Admin');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error creating admin user:', error);
    await AppDataSource.destroy();
  }
};

addAdminUser();