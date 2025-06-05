import AppDataSource from '../data-source';
import { Employee } from '../entities/Employee';

/**
 * Migration to add leave balance columns to employees table
 */
export const addLeaveBalanceColumns = async () => {
  try {
    console.log('Starting migration: Adding leave balance columns to employees table');
    
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    // Check if columns already exist
    const hasAnnualLeaveBalance = await queryRunner.hasColumn('employees', 'annual_leave_balance');
    const hasSickLeaveBalance = await queryRunner.hasColumn('employees', 'sick_leave_balance');
    const hasPersonalLeaveBalance = await queryRunner.hasColumn('employees', 'personal_leave_balance');
    
    // Add columns if they don't exist
    if (!hasAnnualLeaveBalance) {
      await queryRunner.query(`ALTER TABLE employees ADD COLUMN annual_leave_balance INT DEFAULT 20`);
      console.log('Added annual_leave_balance column');
    }
    
    if (!hasSickLeaveBalance) {
      await queryRunner.query(`ALTER TABLE employees ADD COLUMN sick_leave_balance INT DEFAULT 10`);
      console.log('Added sick_leave_balance column');
    }
    
    if (!hasPersonalLeaveBalance) {
      await queryRunner.query(`ALTER TABLE employees ADD COLUMN personal_leave_balance INT DEFAULT 5`);
      console.log('Added personal_leave_balance column');
    }
    
    // Update existing employees with default values
    if (!hasAnnualLeaveBalance || !hasSickLeaveBalance || !hasPersonalLeaveBalance) {
      await queryRunner.query(`
        UPDATE employees 
        SET annual_leave_balance = 20, 
            sick_leave_balance = 10, 
            personal_leave_balance = 5
        WHERE annual_leave_balance IS NULL 
           OR sick_leave_balance IS NULL 
           OR personal_leave_balance IS NULL
      `);
      console.log('Updated existing employees with default leave balances');
    }
    
    await queryRunner.release();
    console.log('Migration completed successfully');
    
    return { success: true, message: 'Leave balance columns added successfully' };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, message: 'Migration failed', error };
  }
};