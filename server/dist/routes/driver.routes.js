"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const driver_controller_1 = require("../controllers/driver.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/', driver_controller_1.getAllDrivers);
router.get('/available', driver_controller_1.getAvailableDrivers);
router.get('/:id', driver_controller_1.getDriverById);
router.post('/', driver_controller_1.createDriver);
router.put('/:id', driver_controller_1.updateDriver);
router.put('/:id/suspend', driver_controller_1.suspendDriver);
router.put('/:id/activate', driver_controller_1.activateDriver);
exports.default = router;
//# sourceMappingURL=driver.routes.js.map