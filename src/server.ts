import Hapi from '@hapi/hapi';
import dotenv from 'dotenv';
import HapiAuthJWT from 'hapi-auth-jwt2';
import { logRequest, isAuthenticated, isManager, isHR } from './middlewares'; // Import your custom middlewares
import employeeRoutes from './routes/employeeRoutes';
import leaveRoutes from './routes/leaveRoutes';
import { authRoutes } from './routes/authRoutes'; // Import the auth route for login
import AppDataSource from './data-source';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'sD7@8kj1!ld$gF30P1wz';

const init = async () => {
  try {
    // Initialize database connection with TypeORM
    await AppDataSource.initialize();
    console.log('Entities:', AppDataSource.entityMetadatas.map(e => e.name));
    await AppDataSource.synchronize();
    console.log('Database schema synchronized.');
  } catch (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  }

  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: 'localhost',
  });

  (server.app as { dataSource: typeof AppDataSource }).dataSource = AppDataSource;

  // Register JWT authentication
  await server.register(HapiAuthJWT);

  // JWT authentication strategy setup
  server.auth.strategy('jwt', 'jwt', {
    key: JWT_SECRET,
    validate: async (decoded, request, h) => {
      return { isValid: true, credentials: decoded };
    },
    verifyOptions: { algorithms: ['HS256'] },
  });

  server.auth.default('jwt'); // Set default auth strategy for all routes

  // Logging middleware
  server.ext('onRequest', logRequest);

  // Public route (no authentication required)
  server.route({
    method: 'GET',
    path: '/',
    options: { auth: false }, // No auth required for this route
    handler: (request, h) => {
      return h.response('Welcome to the Leave Management API!').code(200);
    },
  });

  
  server.route(authRoutes); 

  // Protected routes (employee and leave routes)
  employeeRoutes.forEach(route => server.route(route)); // Register each employee route
  leaveRoutes.forEach(route => server.route(route)); // Register each leave route

  // Start the server
  try {
    console.log(server.table());
    await server.start();
    console.log(`Server running on ${server.info.uri}`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

init().catch((err) => {
  console.error('Error in initialization:', err);
  process.exit(1);
});
