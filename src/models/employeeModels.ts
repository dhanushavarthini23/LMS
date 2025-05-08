import pool from '../config/db'; // Import PostgreSQL connection pool

// Exported Employee interface for reuse
export interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
}

// Get all employees
const getAllEmployees = async (): Promise<Employee[]> => {
  try {
    const result = await pool.query('SELECT * FROM employees');
    return result.rows; // Returns an array of Employee objects
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw new Error('Failed to fetch employees. Please try again later.');
  }
};

// Add a new employee
const addEmployee = async (
  name: string,
  email: string,
  role: string
): Promise<Employee> => {
  try {
    const result = await pool.query(
      'INSERT INTO employees (name, email, role) VALUES ($1, $2, $3) RETURNING *',
      [name, email, role]
    );
    return result.rows[0]; // Returns the created Employee object
  } catch (error) {
    console.error('Error adding employee:', error);
    throw new Error('Failed to add employee. Please try again later.');
  }
};

export { getAllEmployees, addEmployee };
