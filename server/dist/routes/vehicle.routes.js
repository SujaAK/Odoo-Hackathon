"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vehicle_controller_1 = require("../controllers/vehicle.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/', vehicle_controller_1.getAllVehicles);
router.get('/available', vehicle_controller_1.getAvailableVehicles);
router.get('/:id', vehicle_controller_1.getVehicleById);
router.post('/', vehicle_controller_1.createVehicle);
router.put('/:id', vehicle_controller_1.updateVehicle);
router.put('/:id/retire', vehicle_controller_1.retireVehicle);
exports.default = router;
//# sourceMappingURL=vehicle.routes.js.map