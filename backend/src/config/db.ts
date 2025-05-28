import { Pool } from 'pg'; // PostgreSQL client
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();


interface EnvConfig {
  DB_USER: string;
  DB_HOST: string;
  DB_NAME: string;
  DB_PASSWORD: string;
  DB_PORT: number;
}


const config: EnvConfig = {
  DB_USER: process.env.DB_USER || '',
  DB_HOST: process.env.DB_HOST || '',
  DB_NAME: process.env.DB_NAME || '',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432, 
};


if (!config.DB_USER || !config.DB_HOST || !config.DB_NAME || !config.DB_PASSWORD) {
  throw new Error('Missing one or more database environment variables');
}
const pool = new Pool({
  user: config.DB_USER,
  host: config.DB_HOST,
  database: config.DB_NAME,
  password: config.DB_PASSWORD,
  port: config.DB_PORT,
});

export default pool;
