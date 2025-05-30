import Hapi from '@hapi/hapi';
import dotenv from 'dotenv';
import HapiAuthJWT from 'hapi-auth-jwt2';
import Vision from '@hapi/vision';
import HapiSwagger from 'hapi-swagger';
import { logRequest, isAuthenticated, isManager, isHR } from './middlewares';
import employeeRoutes from './routes/employeeRoutes';
import leaveRoutes from './routes/leaveRoutes';
import { authRoutes } from './routes/authRoutes';
import AppDataSource from './data-source';
import dashboardRoutes from './routes/dashboardRoutes';
import Inert from '@hapi/inert';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'sD7@8kj1!ld$gF30P1wz';

const init = async () => {
  try {
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
    routes: {
      cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174'],
        credentials: true,
        headers: ['Accept', 'Content-Type', 'Authorization']
      }
    }
  });

  (server.app as { dataSource: typeof AppDataSource }).dataSource = AppDataSource;
  const swaggerOptions = {
    info: {
      title: 'Leave Management API Documentation',
      version: '1.0.0',
      description: 'API documentation for the Leave Management System'
    },
    securityDefinitions: {
      jwt: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header'
      }
    },
    security: [{ jwt: [] }],
    grouping: 'tags',
    sortEndpoints: 'ordered'
  };

  
  await server.register([
    {
      plugin: HapiAuthJWT
    },
    {
      plugin: Inert
    },
    {
      plugin: Vision
    },
    {
      plugin: HapiSwagger,
      options: swaggerOptions
    }
  ]);
  server.auth.strategy('jwt', 'jwt', {
    key: JWT_SECRET,
    validate: async (decoded, request, h) => {
      return { isValid: true, credentials: decoded };
    },
    verifyOptions: { algorithms: ['HS256'] },
  });

  server.auth.default('jwt');
  server.ext('onRequest', logRequest);
  server.route({
    method: 'GET',
    path: '/',
    options: { auth: false }, 
    handler: (request, h) => {
      return h.response('Welcome to the Leave Management API!').code(200);
    },
  });

  
  server.route(authRoutes); 
  

  employeeRoutes.forEach(route => server.route(route));
  leaveRoutes.forEach(route => server.route(route)); 
  dashboardRoutes.forEach(route => server.route(route));
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
