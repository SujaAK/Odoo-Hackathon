import { Router } from 'express';
import {
  getAllFuelLogs,
  createFuelLog,
  getAllExpenses,
  createExpense,
  getDashboardKPIs,
  getRecentTrips,
  getFuelEfficiency,
  getOperationalCost,
  getVehicleROI,
  getFleetUtilization,
  exportCSV,
} from '../controllers/fuel.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { allowRoles } from '../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

// Fuel logs — view: FM + FA; create: FM only
router.get('/fuel', allowRoles('FLEET_MANAGER', 'FINANCIAL_ANALYST'), getAllFuelLogs);
router.post('/fuel', allowRoles('FLEET_MANAGER', 'DRIVER'), createFuelLog);

// Expenses — view: FM + FA; create: FM only
router.get('/expenses', allowRoles('FLEET_MANAGER', 'FINANCIAL_ANALYST'), getAllExpenses);
router.post('/expenses', allowRoles('FLEET_MANAGER', 'DRIVER'), createExpense);

// Dashboard — All authenticated users
router.get('/dashboard/kpis', getDashboardKPIs);
router.get('/dashboard/recent-trips', getRecentTrips);

// Reports — Fleet Manager + Financial Analyst
router.get('/reports/fuel-efficiency', allowRoles('FLEET_MANAGER', 'FINANCIAL_ANALYST'), getFuelEfficiency);
router.get('/reports/operational-cost', allowRoles('FLEET_MANAGER', 'FINANCIAL_ANALYST'), getOperationalCost);
router.get('/reports/roi', allowRoles('FLEET_MANAGER', 'FINANCIAL_ANALYST'), getVehicleROI);
router.get('/reports/fleet-utilization', allowRoles('FLEET_MANAGER', 'FINANCIAL_ANALYST'), getFleetUtilization);

// CSV Export — Fleet Manager + Financial Analyst
router.get('/export/:type', allowRoles('FLEET_MANAGER', 'FINANCIAL_ANALYST'), exportCSV);

export default router;
