import { logRequest } from './logging';              
import { isAuthenticated, isManager, isHR } from '../middlewares/authorization';

// Exporting all the middleware for easier import
export { logRequest, isAuthenticated, isManager, isHR };