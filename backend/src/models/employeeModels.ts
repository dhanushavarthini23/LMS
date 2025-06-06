import pool from '../config/db';
import logger from '../utils/logger'; 


export type Role = 'employee' | 'manager' | 'hr';
export interface Employee {
  id: number;
  name: string;
  email: string;
  role: Role;
}

const getAllEmployees = async (): Promise<Employee[]> => {
  try {
    const result = await pool.query('SELECT * FROM employees ORDER BY id');
    return result.rows;
  } catch (error) {
    logger.error('Error fetching employees:', error);
    throw new Error('Failed to fetch employees.');
  }
};

const addEmployee = async (
  name: string,
  email: string,
  role: Role
): Promise<Employee> => {
  try {
    const result = await pool.query(
      'INSERT INTO employees (name, email, role) VALUES ($1, $2, $3) RETURNING *',
      [name, email, role]
    );
    return result.rows[0];
  } catch (error) {
    logger.error('Error adding employee:', error);
    throw new Error('Failed to add employee.');
  }
};

const getEmployeeById = async (id: number): Promise<Employee | null> => {
  try {
    const result = await pool.query('SELECT * FROM employees WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error fetching employee by ID:', error);
    throw new Error('Failed to fetch employee profile.');
  }
};

export {
  getAllEmployees,
  addEmployee,
  getEmployeeById
};
