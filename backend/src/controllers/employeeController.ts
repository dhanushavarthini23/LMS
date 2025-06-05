import { Request, ResponseToolkit } from '@hapi/hapi';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import { Employee } from '../entities/Employee';
import { Department } from '../entities/Department'; 
import AppDataSource from '../data-source';
const validRoles = ['Employee', 'Manager', 'HR', 'Admin'] as const;
type Role = (typeof validRoles)[number];

const employeeSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid(...validRoles).required(),
  username: Joi.string().min(3),
  password: Joi.string().min(6),
  departmentId: Joi.number().required().description('Department ID from departments table'),
});


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

    const userId = (request.auth.credentials as any).id;
    const userRole = (request.auth.credentials as any).role;

    let employees: Employee[] = [];

    if (userRole === 'HR' || userRole === 'Admin') {
      employees = await employeeRepository.find({
        relations: ['department', 'manager']
      });
    } else if (userRole === 'Manager') {
      employees = await employeeRepository.find({
        where: [
          { manager: { id: userId } },
          { id: userId }
        ],
        relations: ['department', 'manager']
      });
    } else {
      employees = await employeeRepository.find({
        where: { id: userId },
        relations: ['department', 'manager']
      });
    }

    return h.response(employees).code(200);
  } catch (err) {
    console.error('Error fetching employees:', err);
    return h.response({ error: 'Server error' }).code(500);
  }
};


export const createEmployee = async (
  request: Request,
  h: ResponseToolkit
): Promise<any> => {
  const { error } = employeeSchema.validate(request.payload);
  if (error) {
    return h.response({ error: error.details[0].message }).code(400);
  }

  const { name, email, role, username, password, departmentId } = request.payload as {
    name: string;
    email: string;
    role: Role;
    username?: string;
    password?: string;
    departmentId: number;
  };

  try {
    const employeeRepository = AppDataSource.getRepository(Employee);
    const departmentRepository = AppDataSource.getRepository(Department);

    
    const departmentEntity = await departmentRepository.findOneBy({ id: departmentId, isActive: true });
    if (!departmentEntity) {
      return h.response({ error: `Invalid department ID: ${departmentId}` }).code(400);
    }

    let manager: Employee | undefined = undefined;
    if (request.auth && request.auth.credentials) {
      const userId = (request.auth.credentials as any).id;
      const userRole = (request.auth.credentials as any).role;
      if (userRole === 'Manager') {
        manager = await employeeRepository.findOneBy({ id: userId }) || undefined;
      }
    }

    const newEmployee = employeeRepository.create({
      name,
      email,
      role,
      username: username || email.split('@')[0],
      password: password || 'password123',
      department: departmentEntity,
      manager
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
    const employee = await employeeRepository.findOne({ 
      where: { id: employeeId },
      relations: ['department', 'manager']
    });
    if (!employee) {
      return h.response({ error: 'Employee not found' }).code(404);
    }
    return h.response(employee).code(200);
  } catch (err) {
    console.error('Error fetching employee profile:', err);
    return h.response({ error: 'Server error' }).code(500);
  }
};

export const updateEmployeeProfile = async (
  request: Request,
  h: ResponseToolkit
): Promise<any> => {
  const employeeId = (request.auth.credentials as any).id;
  const { name, email, phone, address, emergencyContact, password } = request.payload as any;

  try {
    const employeeRepository = AppDataSource.getRepository(Employee);
    const employee = await employeeRepository.findOne({ 
      where: { id: employeeId }
    });
    
    if (!employee) {
      return h.response({ error: 'Employee not found' }).code(404);
    }

    if (name) employee.name = name;
    if (email) employee.email = email;
    if (phone) employee.phone = phone;
    if (address) employee.address = address;
    if (emergencyContact) employee.emergencyContact = emergencyContact;
    if (password) {
      const saltRounds = 10;
      employee.password = await bcrypt.hash(password, saltRounds);
    }

    await employeeRepository.save(employee);
    const { password: _, ...employeeWithoutPassword } = employee;
    return h.response({ 
      message: 'Profile updated successfully',
      employee: employeeWithoutPassword 
    }).code(200);
  } catch (err) {
    console.error('Error updating employee profile:', err);
    return h.response({ error: 'Server error' }).code(500);
  }
};
