import { Router } from 'express';
import {
  getAllDrivers,
  getAvailableDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  suspendDriver,
  activateDriver,
  getUnlinkedDriverUsers,
} from '../controllers/driver.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { allowRoles } from '../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', allowRoles('FLEET_MANAGER', 'SAFETY_OFFICER'), getAllDrivers);
router.get('/available', allowRoles('FLEET_MANAGER', 'DRIVER'), getAvailableDrivers);
router.get('/unlinked-users', allowRoles('FLEET_MANAGER'), getUnlinkedDriverUsers);
router.get('/:id', allowRoles('FLEET_MANAGER', 'SAFETY_OFFICER'), getDriverById);
router.post('/', allowRoles('FLEET_MANAGER'), createDriver);
router.put('/:id', allowRoles('FLEET_MANAGER', 'SAFETY_OFFICER'), updateDriver);
router.put('/:id/suspend', allowRoles('FLEET_MANAGER', 'SAFETY_OFFICER'), suspendDriver);
router.put('/:id/activate', allowRoles('FLEET_MANAGER'), activateDriver);

export default router;
