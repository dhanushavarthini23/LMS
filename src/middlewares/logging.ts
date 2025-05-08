import { Request, ResponseToolkit } from '@hapi/hapi';

// This middleware logs the incoming request details (method, path, and headers)
export const logRequest = async (request: Request, h: ResponseToolkit) => {
  console.log(`${new Date().toISOString()} - ${request.method.toUpperCase()} ${request.path}`);
  return h.continue; // Continue to the next step in the route handler
};
