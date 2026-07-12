"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelTrip = exports.completeTrip = exports.dispatchTrip = exports.createTrip = exports.getAllTrips = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getAllTrips = async (req, res) => {
    try {
        const { status } = req.query;
        const where = {};
        if (status)
            where.status = status;
        const trips = await prisma_1.default.trip.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                vehicle: { select: { id: true, regNumber: true, name: true, type: true } },
                driver: { select: { id: true, name: true, licenseNumber: true } },
            },
        });
        res.json(trips);
    }
    catch (error) {
        console.error('GetAllTrips error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.getAllTrips = getAllTrips;
const createTrip = async (req, res) => {
    try {
        const { source, destination, vehicleId, driverId, cargoWeight, plannedDistance } = req.body;
        // Fetch vehicle and driver
        const vehicle = await prisma_1.default.vehicle.findUnique({ where: { id: vehicleId } });
        const driver = await prisma_1.default.driver.findUnique({ where: { id: driverId } });
        if (!vehicle) {
            res.status(404).json({ error: 'Vehicle not found.' });
            return;
        }
        if (!driver) {
            res.status(404).json({ error: 'Driver not found.' });
            return;
        }
        // ── Business Rule Validations ──
        // Vehicle must be AVAILABLE
        if (vehicle.status !== 'AVAILABLE') {
            res.status(400).json({ error: `Vehicle is currently ${vehicle.status}. Only AVAILABLE vehicles can be assigned.` });
            return;
        }
        // Driver must be AVAILABLE
        if (driver.status !== 'AVAILABLE') {
            res.status(400).json({ error: `Driver is currently ${driver.status}. Only AVAILABLE drivers can be assigned.` });
            return;
        }
        // Driver must not have expired license
        if (new Date(driver.licenseExpiry) < new Date()) {
            res.status(400).json({ error: 'Driver\'s license has expired. Cannot assign to trip.' });
            return;
        }
        // Cargo weight must not exceed vehicle max load
        if (cargoWeight > vehicle.maxLoad) {
            res.status(400).json({
                error: `Cargo weight (${cargoWeight}kg) exceeds vehicle max load capacity (${vehicle.maxLoad}kg).`,
            });
            return;
        }
        const trip = await prisma_1.default.trip.create({
            data: {
                source,
                destination,
                vehicleId,
                driverId,
                cargoWeight,
                plannedDistance,
                status: 'DRAFT',
            },
            include: {
                vehicle: { select: { id: true, regNumber: true, name: true } },
                driver: { select: { id: true, name: true } },
            },
        });
        res.status(201).json(trip);
    }
    catch (error) {
        console.error('CreateTrip error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.createTrip = createTrip;
const dispatchTrip = async (req, res) => {
    try {
        const id = req.params.id;
        const trip = await prisma_1.default.trip.findUnique({
            where: { id },
            include: { vehicle: true, driver: true },
        });
        if (!trip) {
            res.status(404).json({ error: 'Trip not found.' });
            return;
        }
        if (trip.status !== 'DRAFT') {
            res.status(400).json({ error: `Cannot dispatch a trip with status ${trip.status}. Only DRAFT trips can be dispatched.` });
            return;
        }
        // Re-validate vehicle and driver availability at dispatch time
        if (trip.vehicle.status !== 'AVAILABLE') {
            res.status(400).json({ error: `Vehicle is currently ${trip.vehicle.status}. Cannot dispatch.` });
            return;
        }
        if (trip.driver.status !== 'AVAILABLE') {
            res.status(400).json({ error: `Driver is currently ${trip.driver.status}. Cannot dispatch.` });
            return;
        }
        if (new Date(trip.driver.licenseExpiry) < new Date()) {
            res.status(400).json({ error: 'Driver\'s license has expired. Cannot dispatch.' });
            return;
        }
        // Transaction: update trip, vehicle, and driver atomically
        const [updatedTrip] = await prisma_1.default.$transaction([
            prisma_1.default.trip.update({
                where: { id },
                data: { status: 'DISPATCHED' },
                include: {
                    vehicle: { select: { id: true, regNumber: true, name: true } },
                    driver: { select: { id: true, name: true } },
                },
            }),
            prisma_1.default.vehicle.update({
                where: { id: trip.vehicleId },
                data: { status: 'ON_TRIP' },
            }),
            prisma_1.default.driver.update({
                where: { id: trip.driverId },
                data: { status: 'ON_TRIP' },
            }),
        ]);
        res.json(updatedTrip);
    }
    catch (error) {
        console.error('DispatchTrip error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.dispatchTrip = dispatchTrip;
const completeTrip = async (req, res) => {
    try {
        const id = req.params.id;
        const { actualDistance, fuelConsumed } = req.body;
        const trip = await prisma_1.default.trip.findUnique({ where: { id } });
        if (!trip) {
            res.status(404).json({ error: 'Trip not found.' });
            return;
        }
        if (trip.status !== 'DISPATCHED') {
            res.status(400).json({ error: `Cannot complete a trip with status ${trip.status}. Only DISPATCHED trips can be completed.` });
            return;
        }
        // Transaction: update trip, vehicle, and driver atomically
        const [updatedTrip] = await prisma_1.default.$transaction([
            prisma_1.default.trip.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    actualDistance: actualDistance || null,
                    fuelConsumed: fuelConsumed || null,
                },
                include: {
                    vehicle: { select: { id: true, regNumber: true, name: true } },
                    driver: { select: { id: true, name: true } },
                },
            }),
            prisma_1.default.vehicle.update({
                where: { id: trip.vehicleId },
                data: { status: 'AVAILABLE' },
            }),
            prisma_1.default.driver.update({
                where: { id: trip.driverId },
                data: { status: 'AVAILABLE' },
            }),
        ]);
        res.json(updatedTrip);
    }
    catch (error) {
        console.error('CompleteTrip error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.completeTrip = completeTrip;
const cancelTrip = async (req, res) => {
    try {
        const id = req.params.id;
        const trip = await prisma_1.default.trip.findUnique({ where: { id } });
        if (!trip) {
            res.status(404).json({ error: 'Trip not found.' });
            return;
        }
        if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
            res.status(400).json({ error: `Cannot cancel a trip with status ${trip.status}.` });
            return;
        }
        const updates = [
            prisma_1.default.trip.update({
                where: { id },
                data: { status: 'CANCELLED' },
                include: {
                    vehicle: { select: { id: true, regNumber: true, name: true } },
                    driver: { select: { id: true, name: true } },
                },
            }),
        ];
        // If trip was DISPATCHED, restore vehicle and driver to AVAILABLE
        if (trip.status === 'DISPATCHED') {
            updates.push(prisma_1.default.vehicle.update({
                where: { id: trip.vehicleId },
                data: { status: 'AVAILABLE' },
            }), prisma_1.default.driver.update({
                where: { id: trip.driverId },
                data: { status: 'AVAILABLE' },
            }));
        }
        const [updatedTrip] = await prisma_1.default.$transaction(updates);
        res.json(updatedTrip);
    }
    catch (error) {
        console.error('CancelTrip error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.cancelTrip = cancelTrip;
//# sourceMappingURL=trip.controller.js.map