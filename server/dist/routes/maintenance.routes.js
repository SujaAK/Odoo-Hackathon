"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const maintenance_controller_1 = require("../controllers/maintenance.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/', maintenance_controller_1.getAllMaintenanceLogs);
router.post('/', maintenance_controller_1.createMaintenanceLog);
router.put('/:id/close', maintenance_controller_1.closeMaintenanceLog);
exports.default = router;
//# sourceMappingURL=maintenance.routes.js.map