import {
  getAllEmployees,
  addEmployee,
  getEmployeeById,
  Employee,
} from '../models/employeeModels';
import { Request, ResponseToolkit } from '@hapi/hapi';
import Joi from 'joi';

// Define allowed roles
const validRoles = ['employee', 'manager', 'hr'] as const;
type Role = (typeof validRoles)[number];

// Payload validation schema
const employeeSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid(...validRoles).required(),
});

// GET /api/employees
export const getEmployees = async (
  request: Request,
  h: ResponseToolkit
): Promise<any> => {
  try {
    const employees: Employee[] = await getAllEmployees();
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

  const { name, email, role } = request.payload as {
    name: string;
    email: string;
    role: Role;
  };

  try {
    const newEmployee: Employee = await addEmployee(name, email, role);
    return h.response(newEmployee).code(201);
  } catch (err) {
    console.error('Error creating employee:', err);
    return h.response({ error: 'Server error' }).code(500);
  }
};

// GET /api/employees/profile
export const getEmployeeProfile = async (
  request: Request,
  h: ResponseToolkit
): Promise<any> => {
  const employeeId = (request.auth.credentials as any).id;

  try {
    const employee = await getEmployeeById(employeeId);
    if (!employee) {
      return h.response({ error: 'Employee not found' }).code(404);
    }
    return h.response(employee).code(200);
  } catch (err) {
    console.error('Error fetching employee profile:', err);
    return h.response({ error: 'Server error' }).code(500);
  }
};
