import AppDataSource from '../data-source';
import { Employee } from '../entities/Employee';
import { LeaveRequest } from '../entities/LeaveRequest';
import { Department } from '../entities/Department';
import { LeaveType } from '../entities/LeaveType';
import { seedNormalizedData } from '../seedNormalizedData';

export async function normalizeExistingData() {
  try {
    console.log('Starting database normalization migration...');
    console.log('Step 1: Seeding normalized reference data...');
    const { departments, leaveTypes } = await seedNormalizedData();
    
    const departmentRepo = AppDataSource.getRepository(Department);
    const leaveTypeRepo = AppDataSource.getRepository(LeaveType);
    const employeeRepo = AppDataSource.getRepository(Employee);
    const leaveRequestRepo = AppDataSource.getRepository(LeaveRequest);

    //Create mapping objects 
    const departmentMap = new Map<string, Department>();
    departments.forEach(dept => {
      departmentMap.set(dept.code, dept);
      departmentMap.set(dept.name, dept);
    });

    const leaveTypeMap = new Map<string, LeaveType>();
    leaveTypes.forEach(lt => {
      leaveTypeMap.set(lt.name, lt);
    });

    //Migrate employee departments
    console.log('Step 2: Migrating employee departments...');
    const employees = await employeeRepo.find();
    let employeeUpdateCount = 0;
    
    for (const employee of employees) {
      const currentDepartment = (employee as any).department;
      
      if (currentDepartment && typeof currentDepartment === 'string') {
        const department = departmentMap.get(currentDepartment);
        
        if (department) {
          // Update employee with department
          await employeeRepo.update(employee.id, { 
            department: department 
          });
          employeeUpdateCount++;
          console.log(`Updated employee ${employee.name}: ${currentDepartment} -> Department ID ${department.id}`);
        } else {
          console.warn(`Unknown department for employee ${employee.name}: ${currentDepartment}`);
          const newDepartment = departmentRepo.create({
            name: currentDepartment,
            code: currentDepartment.substring(0, 3).toUpperCase(),
            description: `${currentDepartment} department (auto-created during migration)`,
            isActive: true
          });
          
          const savedDepartment = await departmentRepo.save(newDepartment);
          await employeeRepo.update(employee.id, { 
            department: savedDepartment 
          });
          
          departmentMap.set(currentDepartment, savedDepartment);
          employeeUpdateCount++;
          console.log(`Created new department and updated employee ${employee.name}: ${currentDepartment}`);
        }
      } else if (!currentDepartment) {
        // Assign default department (IT) to employees without department
        const defaultDepartment = departmentMap.get('IT');
        if (defaultDepartment) {
          await employeeRepo.update(employee.id, { 
            department: defaultDepartment 
          });
          employeeUpdateCount++;
          console.log(`Assigned default department (IT) to employee ${employee.name}`);
        }
      }
    }

    //Migrate leave request types
    console.log('Step 3: Migrating leave request types...');
    const leaveRequests = await leaveRequestRepo.find();
    let leaveRequestUpdateCount = 0;
    
    for (const leaveRequest of leaveRequests) {
      const currentLeaveType = (leaveRequest as any).leaveType;
      
      if (currentLeaveType && typeof currentLeaveType === 'string') {
        const leaveType = leaveTypeMap.get(currentLeaveType);
        
        if (leaveType) {
          // Update leave request with leave type reference
          await leaveRequestRepo.update(leaveRequest.id, { 
            leaveType: leaveType 
          });
          leaveRequestUpdateCount++;
          console.log(`Updated leave request ${leaveRequest.id}: ${currentLeaveType} -> LeaveType ID ${leaveType.id}`);
        } else {
          console.warn(`Unknown leave type for request ${leaveRequest.id}: ${currentLeaveType}`);
          
          // Create new leave type if it doesn't exist
          const newLeaveType = leaveTypeRepo.create({
            name: currentLeaveType,
            description: `${currentLeaveType} (auto-created during migration)`,
            maxDaysPerYear: 20,
            requiresApproval: true,
            approvalLevels: 2,
            isActive: true
          });
          
          const savedLeaveType = await leaveTypeRepo.save(newLeaveType);
          await leaveRequestRepo.update(leaveRequest.id, { 
            leaveType: savedLeaveType 
          });
          
          leaveTypeMap.set(currentLeaveType, savedLeaveType);
          leaveRequestUpdateCount++;
          console.log(`Created new leave type and updated request ${leaveRequest.id}: ${currentLeaveType}`);
        }
      } else if (!currentLeaveType) {
        // Assign default leave type (Annual Leave) to requests without type
        const defaultLeaveType = leaveTypeMap.get('Annual Leave');
        if (defaultLeaveType) {
          await leaveRequestRepo.update(leaveRequest.id, { 
            leaveType: defaultLeaveType 
          });
          leaveRequestUpdateCount++;
          console.log(`Assigned default leave type (Annual Leave) to request ${leaveRequest.id}`);
        }
      }
    }

    //Verification
    console.log('🔍 Step 4: Verifying migration...');
    
    const updatedEmployees = await employeeRepo.find({ relations: ['department'] });
    const employeesWithDepartments = updatedEmployees.filter(emp => emp.department).length;
    
    const updatedLeaveRequests = await leaveRequestRepo.find({ relations: ['leaveType'] });
    const requestsWithLeaveTypes = updatedLeaveRequests.filter(req => req.leaveType).length;
    
    console.log('\nMigration Summary:');
    console.log(` Employees updated: ${employeeUpdateCount}/${employees.length}`);
    console.log(`Employees with departments: ${employeesWithDepartments}/${employees.length}`);
    console.log(`Leave requests updated: ${leaveRequestUpdateCount}/${leaveRequests.length}`);
    console.log(`Leave requests with types: ${requestsWithLeaveTypes}/${leaveRequests.length}`);
    console.log(`Total departments: ${departments.length}`);
    console.log(`Total leave types: ${leaveTypes.length}`);

    if (employeesWithDepartments === employees.length && requestsWithLeaveTypes === leaveRequests.length) {
      console.log('\nMigration completed successfully! All records have been normalized.');
    } else {
      console.log('\nMigration completed with some issues. Please review the logs above.');
    }

    return {
      employeesUpdated: employeeUpdateCount,
      leaveRequestsUpdated: leaveRequestUpdateCount,
      totalDepartments: departments.length,
      totalLeaveTypes: leaveTypes.length,
      success: employeesWithDepartments === employees.length && requestsWithLeaveTypes === leaveRequests.length
    };

  } catch (error) {
    console.error('Error during database normalization:', error);
    throw error;
  }
}
if (require.main === module) {
  AppDataSource.initialize()
    .then(async () => {
      const result = await normalizeExistingData();
      await AppDataSource.destroy();
      
      if (result.success) {
        console.log('\nMigration process completed successfully!');
        process.exit(0);
      } else {
        console.log('\nMigration process completed with errors!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}