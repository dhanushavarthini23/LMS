import AppDataSource from './data-source';
import { Department } from './entities/Department';
import { LeaveType } from './entities/LeaveType';

export async function seedNormalizedData() {
  try {
    console.log('Seeding normalized data...');
    const departmentRepo = AppDataSource.getRepository(Department);
    
    const departments = [
      { 
        name: 'Information Technology', 
        code: 'IT', 
        description: 'Technology and software development department'
      },
      { 
        name: 'Human Resources', 
        code: 'HR', 
        description: 'Employee management and recruitment department'
      },
      { 
        name: 'Finance', 
        code: 'FIN', 
        description: 'Financial planning and accounting department'
      },
      { 
        name: 'Marketing', 
        code: 'MKT', 
        description: 'Marketing and brand management department'
      },
      { 
        name: 'Operations', 
        code: 'OPS', 
        description: 'Business operations and logistics department'
      },
      { 
        name: 'Sales', 
        code: 'SAL', 
        description: 'Sales and customer acquisition department'
      },
      { 
        name: 'Engineering', 
        code: 'ENG', 
        description: 'Product engineering and development department'
      },
      { 
        name: 'Customer Support', 
        code: 'CS', 
        description: 'Customer service and support department'
      }
    ];

    for (const deptData of departments) {
      const existingDept = await departmentRepo.findOne({ 
        where: [
          { code: deptData.code },
          { name: deptData.name }
        ]
      });
      
      if (!existingDept) {
        const department = departmentRepo.create(deptData);
        await departmentRepo.save(department);
        console.log(`Created department: ${deptData.name} (${deptData.code})`);
      } else {
        console.log(`Department already exists: ${deptData.name}`);
      }
    }

    // Seed Leave Types based on current enum values
    const leaveTypeRepo = AppDataSource.getRepository(LeaveType);
    
    const leaveTypes = [
      { 
        name: 'Annual Leave', 
        description: 'Yearly vacation leave for rest and recreation', 
        maxDaysPerYear: 20,
        requiresApproval: true,
        approvalLevels: 2,
        isActive: true 
      },
      { 
        name: 'Sick Leave', 
        description: 'Medical leave for illness or health-related issues', 
        maxDaysPerYear: 10,
        requiresApproval: true,
        approvalLevels: 1, // Only manager approval needed
        isActive: true 
      },
      { 
        name: 'Personal Leave', 
        description: 'Personal time off for personal matters', 
        maxDaysPerYear: 5,
        requiresApproval: true,
        approvalLevels: 2,
        isActive: true 
      },
      { 
        name: 'Maternity Leave', 
        description: 'Leave for new mothers', 
        maxDaysPerYear: 90,
        requiresApproval: true,
        approvalLevels: 1, // HR approval only
        isActive: true 
      },
      { 
        name: 'Paternity Leave', 
        description: 'Leave for new fathers', 
        maxDaysPerYear: 15,
        requiresApproval: true,
        approvalLevels: 1,
        isActive: true 
      },
      { 
        name: 'Emergency Leave', 
        description: 'Emergency situations requiring immediate time off', 
        maxDaysPerYear: 3,
        requiresApproval: true,
        approvalLevels: 1,
        isActive: true 
      },
      { 
        name: 'Other', 
        description: 'Other types of leave not covered by standard categories', 
        maxDaysPerYear: 0, // No limit, case by case
        requiresApproval: true,
        approvalLevels: 2,
        isActive: true 
      }
    ];

    for (const leaveTypeData of leaveTypes) {
      const existingLeaveType = await leaveTypeRepo.findOne({ 
        where: { name: leaveTypeData.name } 
      });
      
      if (!existingLeaveType) {
        const leaveType = leaveTypeRepo.create(leaveTypeData);
        await leaveTypeRepo.save(leaveType);
        console.log(`Created leave type: ${leaveTypeData.name} (${leaveTypeData.maxDaysPerYear} days/year)`);
      } else {
        console.log(`Leave type already exists: ${leaveTypeData.name}`);
      }
    }

    console.log('Normalized data seeding completed successfully!');
    const allDepartments = await departmentRepo.find();
    const allLeaveTypes = await leaveTypeRepo.find();
    
    return {
      departments: allDepartments,
      leaveTypes: allLeaveTypes
    };
    
  } catch (error) {
    console.error('Error seeding normalized data:', error);
    throw error;
  }
}
if (require.main === module) {
  AppDataSource.initialize()
    .then(async () => {
      await seedNormalizedData();
      await AppDataSource.destroy();
      console.log('🏁 Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}