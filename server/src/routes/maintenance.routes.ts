import { Router } from 'express';
import {
  getAllMaintenanceLogs,
  createMaintenanceLog,
  closeMaintenanceLog,
} from '../controllers/maintenance.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { allowRoles } from '../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', allowRoles('FLEET_MANAGER', 'SAFETY_OFFICER'), getAllMaintenanceLogs);
router.post('/', allowRoles('FLEET_MANAGER'), createMaintenanceLog);
router.put('/:id/close', allowRoles('FLEET_MANAGER'), closeMaintenanceLog);

export default router;
