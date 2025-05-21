import { ServerRoute } from '@hapi/hapi';
import { Delegation } from '../entities/Delegation';
import { Employee } from '../entities/Employee';
import AppDataSource from '../data-source';

const delegationRoutes: ServerRoute[] = [
  // Get all delegations for the current user
  {
    method: 'GET',
    path: '/api/delegations',
    handler: async (request, h) => {
      const userId = (request.auth.credentials as any).id;
      const repo = AppDataSource.getRepository(Delegation);
      
      try {
        const delegations = await repo.find({
          where: { manager: { id: userId } },
          relations: ['delegate', 'manager'],
          order: { createdAt: 'DESC' }
        });
        
        // Format the response
        const formattedDelegations = delegations.map(delegation => ({
          id: delegation.id,
          delegateId: delegation.delegate.id,
          delegateName: delegation.delegate.name,
          startDate: delegation.startDate,
          endDate: delegation.endDate,
          reason: delegation.reason,
          status: delegation.status,
          createdAt: delegation.createdAt
        }));
        
        return h.response(formattedDelegations).code(200);
      } catch (error) {
        console.error('Error fetching delegations:', error);
        return h.response({ error: 'Failed to fetch delegations' }).code(500);
      }
    }
  },
  
  // Create a new delegation
  {
    method: 'POST',
    path: '/api/delegations',
    handler: async (request, h) => {
      const userId = (request.auth.credentials as any).id;
      const { delegateId, startDate, endDate, reason } = request.payload as any;
      
      const delegationRepo = AppDataSource.getRepository(Delegation);
      const employeeRepo = AppDataSource.getRepository(Employee);
      
      try {
        // Get the manager and delegate
        const manager = await employeeRepo.findOneBy({ id: userId });
        const delegate = await employeeRepo.findOneBy({ id: delegateId });
        
        if (!manager || !delegate) {
          return h.response({ error: 'Manager or delegate not found' }).code(404);
        }
        
        // Create the delegation
        const delegation = new Delegation();
        delegation.manager = manager;
        delegation.delegate = delegate;
        delegation.startDate = new Date(startDate);
        delegation.endDate = new Date(endDate);
        delegation.reason = reason;
        delegation.status = 'Pending';
        
        const savedDelegation = await delegationRepo.save(delegation);
        
        return h.response({
          id: savedDelegation.id,
          delegateId: delegate.id,
          delegateName: delegate.name,
          startDate: savedDelegation.startDate,
          endDate: savedDelegation.endDate,
          reason: savedDelegation.reason,
          status: savedDelegation.status,
          createdAt: savedDelegation.createdAt
        }).code(201);
      } catch (error) {
        console.error('Error creating delegation:', error);
        return h.response({ error: 'Failed to create delegation' }).code(500);
      }
    }
  },
  
  // Cancel a delegation
  {
    method: 'PUT',
    path: '/api/delegations/{id}/cancel',
    handler: async (request, h) => {
      const userId = (request.auth.credentials as any).id;
      const delegationId = parseInt(request.params.id);
      
      const repo = AppDataSource.getRepository(Delegation);
      
      try {
        // Find the delegation
        const delegation = await repo.findOne({
          where: { id: delegationId, manager: { id: userId } },
          relations: ['delegate', 'manager']
        });
        
        if (!delegation) {
          return h.response({ error: 'Delegation not found' }).code(404);
        }
        
        // Update the status
        delegation.status = 'Cancelled';
        await repo.save(delegation);
        
        return h.response({
          id: delegation.id,
          delegateId: delegation.delegate.id,
          delegateName: delegation.delegate.name,
          startDate: delegation.startDate,
          endDate: delegation.endDate,
          reason: delegation.reason,
          status: delegation.status,
          updatedAt: delegation.updatedAt
        }).code(200);
      } catch (error) {
        console.error('Error cancelling delegation:', error);
        return h.response({ error: 'Failed to cancel delegation' }).code(500);
      }
    }
  }
];

export default delegationRoutes;