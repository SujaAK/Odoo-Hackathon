"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fuel_controller_1 = require("../controllers/fuel.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Fuel logs
router.get('/fuel', fuel_controller_1.getAllFuelLogs);
router.post('/fuel', fuel_controller_1.createFuelLog);
// Expenses
router.get('/expenses', fuel_controller_1.getAllExpenses);
router.post('/expenses', fuel_controller_1.createExpense);
// Dashboard
router.get('/dashboard/kpis', fuel_controller_1.getDashboardKPIs);
router.get('/dashboard/recent-trips', fuel_controller_1.getRecentTrips);
// Reports
router.get('/reports/fuel-efficiency', fuel_controller_1.getFuelEfficiency);
router.get('/reports/operational-cost', fuel_controller_1.getOperationalCost);
router.get('/reports/roi', fuel_controller_1.getVehicleROI);
router.get('/reports/fleet-utilization', fuel_controller_1.getFleetUtilization);
// CSV Export
router.get('/export/:type', fuel_controller_1.exportCSV);
exports.default = router;
//# sourceMappingURL=fuel.routes.js.map