"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trip_controller_1 = require("../controllers/trip.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/', trip_controller_1.getAllTrips);
router.post('/', trip_controller_1.createTrip);
router.put('/:id/dispatch', trip_controller_1.dispatchTrip);
router.put('/:id/complete', trip_controller_1.completeTrip);
router.put('/:id/cancel', trip_controller_1.cancelTrip);
exports.default = router;
//# sourceMappingURL=trip.routes.js.map