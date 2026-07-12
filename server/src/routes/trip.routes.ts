import { Router } from 'express';
import {
  getAllTrips,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
} from '../controllers/trip.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { allowRoles } from '../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllTrips);
router.post('/', allowRoles('FLEET_MANAGER', 'DRIVER'), createTrip);
router.put('/:id/dispatch', allowRoles('FLEET_MANAGER', 'DRIVER'), dispatchTrip);
router.put('/:id/complete', allowRoles('FLEET_MANAGER', 'DRIVER'), completeTrip);
router.put('/:id/cancel', allowRoles('FLEET_MANAGER', 'DRIVER'), cancelTrip);

export default router;
