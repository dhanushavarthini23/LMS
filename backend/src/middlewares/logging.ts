import { Request, ResponseToolkit } from '@hapi/hapi';

export const logRequest = async (request: Request, h: ResponseToolkit) => {
  console.log(`${new Date().toISOString()} - ${request.method.toUpperCase()} ${request.path}`);
  return h.continue; 
};
