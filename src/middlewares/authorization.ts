import { Request, ResponseToolkit } from '@hapi/hapi';

// Define only the part of credentials you care about
interface CustomAuthCredentials {
  id: number;
  role: string;
  [key: string]: any;
}

// Middleware to check if the user is a manager
export const isManager = async (request: Request, h: ResponseToolkit) => {
  const credentials = request.auth.credentials as CustomAuthCredentials;

  if (!credentials || credentials.role !== 'manager') {
    return h.response({ message: 'Unauthorized: Only managers can approve leave requests' }).code(403);
  }

  return h.continue;
};

// Middleware to check if the user is HR
export const isHR = async (request: Request, h: ResponseToolkit) => {
  const credentials = request.auth.credentials as CustomAuthCredentials;

  if (!credentials || credentials.role !== 'hr') {
    return h.response({ message: 'Unauthorized: Only HR can perform this action' }).code(403);
  }

  return h.continue;
};

// Middleware to check if the user is authenticated
export const isAuthenticated = async (request: Request, h: ResponseToolkit) => {
  const credentials = request.auth.credentials as CustomAuthCredentials;

  if (!credentials) {
    return h.response({ message: 'Unauthorized: Please log in' }).code(401);
  }

  return h.continue;
};
