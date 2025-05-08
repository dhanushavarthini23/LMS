// src/routes/authRoutes.ts
import { ServerRoute } from '@hapi/hapi';
import { AuthController } from '../controllers/authController';

export const authRoutes: ServerRoute[] = [
  {
    method: 'POST',
    path: '/login',
    options: {
      auth: false,
      tags: ['api'],
      description: 'Login with username and password',
      notes: 'Returns JWT if successful',
      handler: AuthController.login, // Use the real handler
    },
  },
];
