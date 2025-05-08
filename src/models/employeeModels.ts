import pool from '../config/db'; // PostgreSQL connection pool

// Define allowed roles
export type Role = 'employee' | 'manager' | 'hr';

// Exported Employee interface for reuse
export interface Employee {
  id: number;
  name: string;
  email: string;
  role: Role;
}

// Get all employees
const getAllEmployees = async (): Promise<Employee[]> => {
  try {
    const result = await pool.query('SELECT * FROM employees ORDER BY id');
    return result.rows;
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw new Error('Failed to fetch employees.');
  }
};

// Add a new employee
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
    console.error('Error adding employee:', error);
    throw new Error('Failed to add employee.');
  }
};

// Get employee by ID (for profile route)
const getEmployeeById = async (id: number): Promise<Employee | null> => {
  try {
    const result = await pool.query('SELECT * FROM employees WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching employee by ID:', error);
    throw new Error('Failed to fetch employee profile.');
  }
};

export {
  getAllEmployees,
  addEmployee,
  getEmployeeById
};
