import { Request, ResponseToolkit } from '@hapi/hapi';
import Joi from 'joi';
import { Employee } from '../entities/Employee';
import AppDataSource from '../data-source';

// Defining the roles
const validRoles = ['Employee', 'Manager', 'HR'] as const;
type Role = (typeof validRoles)[number];

// Defining the departments
const validDepartments = ['IT', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales', 'Engineering', 'Customer Support'] as const;
type Department = (typeof validDepartments)[number];
const employeeSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid(...validRoles).required(),
  username: Joi.string().min(3),
  password: Joi.string().min(6),
  department: Joi.string().valid(...validDepartments).required(),
});

// GET /api/employees
export const getEmployees = async (
  request: Request,
  h: ResponseToolkit
): Promise<any> => {
  try {
    const employeeRepository = AppDataSource.getRepository(Employee);
    
   
    if (!request.auth || !request.auth.credentials) {
      const employees = await employeeRepository.find();
      return h.response(employees).code(200);
    }
    
    // Get the user's role and ID
    const userId = (request.auth.credentials as any).id;
    const userRole = (request.auth.credentials as any).role;
    
    let employees: Employee[] = [];
    
    
    if (userRole === 'HR') {
      employees = await employeeRepository.find();
    } else if (userRole === 'Manager') {
      employees = await employeeRepository.find({
        where: [
          { manager: { id: userId } }, 
          { id: userId }               
        ]
      });
    } else {
      
      employees = await employeeRepository.find({
        where: { id: userId }
      });
    }
    
    return h.response(employees).code(200);
  } catch (err) {
    console.error('Error fetching employees:', err);
    return h.response({ error: 'Server error' }).code(500);
  }
};

// POST /api/employees
export const createEmployee = async (
  request: Request,
  h: ResponseToolkit
): Promise<any> => {
  const { error } = employeeSchema.validate(request.payload);
  if (error) {
    return h.response({ error: error.details[0].message }).code(400);
  }

  const { name, email, role, username, password, department } = request.payload as {
    name: string;
    email: string;
    role: Role;
    username?: string;
    password?: string;
    department: Department;
  };

  try {
    const employeeRepository = AppDataSource.getRepository(Employee);
    
    // If the request is authenticated, get the current user
    let manager: Employee | undefined = undefined;
    if (request.auth && request.auth.credentials) {
      const userId = (request.auth.credentials as any).id;
      const userRole = (request.auth.credentials as any).role;
      
      // If the current user is a manager, assign them as the manager
      if (userRole === 'Manager') {
        manager = await employeeRepository.findOne({ where: { id: userId } }) || undefined;
      }
    }
    
    // Create employee using TypeORM
    const newEmployee = employeeRepository.create({
      name,
      email,
      role,
      username: username || email.split('@')[0],
      password: password || 'password123', // Default password
      department,
      manager: manager
    });
    
    await employeeRepository.save(newEmployee);
    return h.response(newEmployee).code(201);
  } catch (err) {
    console.error('Error creating employee:', err);
    return h.response({ error: 'Server error' }).code(500);
  }
};
export const getEmployeeProfile = async (
  request: Request,
  h: ResponseToolkit
): Promise<any> => {
  const employeeId = (request.auth.credentials as any).id;

  try {
    const employeeRepository = AppDataSource.getRepository(Employee);
    const employee = await employeeRepository.findOne({ where: { id: employeeId } });
    if (!employee) {
      return h.response({ error: 'Employee not found' }).code(404);
    }
    return h.response(employee).code(200);
  } catch (err) {
    console.error('Error fetching employee profile:', err);
    return h.response({ error: 'Server error' }).code(500);
  }
};
