import AppDataSource from '../data-source';
import { addLeaveBalanceColumns } from './addLeaveBalanceColumns';

const runMigration = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Data source initialized');
    const result = await addLeaveBalanceColumns();
    
    if (result.success) {
      console.log('Migration completed successfully:', result.message);
    } else {
      console.error('Migration failed:', result.message, result.error);
    }

    await AppDataSource.destroy();
    console.log('Data source connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
};

runMigration();