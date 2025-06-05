#!/usr/bin/env node

/**
 * Database Normalization Runner
 * 
 * This script safely migrates the database from denormalized (enum-based) 
 * departments and leave types to a normalized schema with proper foreign key relationships.
 * 
 * Usage:
 *   npm run normalize-db
 *   or
 *   npx ts-node src/runNormalization.ts
 */

import AppDataSource from './data-source';
import { normalizeExistingData } from './migrations/normalizeExistingData';

async function runNormalization() {

  try {
    // Initialize database connection
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('Database connection established\n');

    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (!isDevelopment) {
      console.log('⚠️  WARNING: Running in production mode!');
      console.log('Please ensure you have a backup of your database before proceeding.\n');
    }

    // Run the normalization
    console.log('Running normalization migration...\n');
    const result = await normalizeExistingData();

    // Display results
    console.log('\nFinal Results:');
    console.log('================');
    console.log(`Employees updated: ${result.employeesUpdated}`);
    console.log(`Leave requests updated: ${result.leaveRequestsUpdated}`);
    console.log(`Departments created: ${result.totalDepartments}`);
    console.log(`Leave types created: ${result.totalLeaveTypes}`);
    console.log(` Migration successful: ${result.success ? 'YES' : 'NO'}`);

    if (result.success) {
      console.log('\n Database normalization completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Update your entity files to use the new normalized relationships');
      console.log('2. Update your controllers to work with the new schema');
      console.log('3. Update your API documentation');
      console.log('4. Test all functionality thoroughly');
    } else {
      console.log('\nDatabase normalization completed with issues!');
      console.log('Please review the migration logs and fix any issues before proceeding.');
    }

  } catch (error) {
    console.error('\nNormalization failed:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    process.exit(1);
  } finally {
    // Clean up database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('\nDatabase connection closed');
    }
  }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\nProcess interrupted by user');
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n Process terminated');
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});

// Run the normalization
runNormalization();