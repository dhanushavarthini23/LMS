// src/routes/authRoutes.ts
import { ServerRoute } from '@hapi/hapi';
import { AuthController } from '../controllers/authController';
import Joi from 'joi';

export const authRoutes: ServerRoute[] = [
  {
    method: 'POST',
    path: '/login',
    options: {
      auth: false,
      tags: ['api', 'authentication'],
      description: 'Login with username and password',
      notes: 'Returns JWT token if authentication is successful',
      validate: {
        payload: Joi.object({
          username: Joi.string().required().description('Username for login'),
          password: Joi.string().required().description('User password')
        })
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              description: 'Login successful',
              schema: Joi.object({
                token: Joi.string().required().description('JWT authentication token')
              })
            },
            '401': {
              description: 'Invalid credentials',
              schema: Joi.object({
                message: Joi.string().required().example('Invalid username or password')
              })
            },
            '500': {
              description: 'Server error',
              schema: Joi.object({
                message: Joi.string().required()
              })
            }
          }
        }
      },
      handler: AuthController.login, 
    },
  },
];
