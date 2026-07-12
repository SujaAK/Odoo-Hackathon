import { Router } from 'express';
import {
  getAllVehicles,
  getAvailableVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  retireVehicle,
} from '../controllers/vehicle.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { allowRoles } from '../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllVehicles);
router.get('/available', allowRoles('FLEET_MANAGER', 'DRIVER'), getAvailableVehicles);
router.get('/:id', getVehicleById);
router.post('/', allowRoles('FLEET_MANAGER'), createVehicle);
router.put('/:id', allowRoles('FLEET_MANAGER'), updateVehicle);
router.put('/:id/retire', allowRoles('FLEET_MANAGER'), retireVehicle);

export default router;
