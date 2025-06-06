import { Request, ResponseToolkit } from '@hapi/hapi';
import logger from '../utils/logger';

export const logRequest = async (request: Request, h: ResponseToolkit) => {
  logger.http(`${request.method.toUpperCase()} ${request.path}`);
  return h.continue; 
};
