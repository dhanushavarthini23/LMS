import AppDataSource from '../data-source';
import { Employee } from '../entities/Employee';
import { Department } from '../entities/Department';
import { IsNull } from 'typeorm';
export async function updateEmployeeDepartments() {
  try {
    console.log('Updating existing employees with departments...');

    const employeeRepo = AppDataSource.getRepository(Employee);
    const departmentRepo = AppDataSource.getRepository(Department);
    const employees = await employeeRepo.find({
      where:  {department: IsNull()}
    });
    const departments = await departmentRepo.find();

    if (departments.length === 0) {
      console.log('No departments found. Please run seed:normalized first.');
      return;
    }

    console.log(`Found ${employees.length} employees without departments`);
    console.log(`Found ${departments.length} departments available`);
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      let assignedDepartment: Department;
      if (employee.role === 'HR' || employee.name.toLowerCase().includes('hr')) {
        assignedDepartment = departments.find(d => d.code === 'HR') || departments[0];
      } else if (employee.role === 'Manager') {
        const managerDepts = ['IT', 'ENG', 'SAL', 'MKT', 'FIN'];
        const deptCode = managerDepts[i % managerDepts.length];
        assignedDepartment = departments.find(d => d.code === deptCode) || departments[0];
      } else {
        assignedDepartment = departments[i % departments.length];
      }

      employee.department = assignedDepartment;
      await employeeRepo.save(employee);
      
      console.log(`Assigned ${employee.name} (${employee.role}) to ${assignedDepartment.name} (${assignedDepartment.code})`);
    }

    console.log('Employee department assignment completed successfully!');
    
    // Show summary
    const updatedEmployees = await employeeRepo.find({
      relations: ['department']
    });
    
    console.log('\nSummary:');
    updatedEmployees.forEach(emp => {
      console.log(`   ${emp.name} (${emp.role}) → ${emp.department?.name || 'No Department'}`);
    });

  } catch (error) {
    console.error('Error updating employee departments:', error);
    throw error;
  }
}
if (require.main === module) {
  AppDataSource.initialize()
    .then(async () => {
      await updateEmployeeDepartments();
      await AppDataSource.destroy();
      console.log('🏁 Update process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Update failed:', error);
      process.exit(1);
    });
}