"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeMaintenanceLog = exports.createMaintenanceLog = exports.getAllMaintenanceLogs = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getAllMaintenanceLogs = async (req, res) => {
    try {
        const { status } = req.query;
        const where = {};
        if (status)
            where.status = status;
        const logs = await prisma_1.default.maintenanceLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                vehicle: { select: { id: true, regNumber: true, name: true } },
            },
        });
        res.json(logs);
    }
    catch (error) {
        console.error('GetAllMaintenanceLogs error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.getAllMaintenanceLogs = getAllMaintenanceLogs;
const createMaintenanceLog = async (req, res) => {
    try {
        const { vehicleId, type, description, cost, startDate } = req.body;
        // Verify vehicle exists
        const vehicle = await prisma_1.default.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle) {
            res.status(404).json({ error: 'Vehicle not found.' });
            return;
        }
        if (vehicle.status === 'ON_TRIP') {
            res.status(400).json({ error: 'Cannot create maintenance for a vehicle currently on a trip.' });
            return;
        }
        // Transaction: create log + set vehicle to IN_SHOP
        const [log] = await prisma_1.default.$transaction([
            prisma_1.default.maintenanceLog.create({
                data: {
                    vehicleId,
                    type,
                    description,
                    cost: cost || 0,
                    startDate: new Date(startDate),
                },
                include: {
                    vehicle: { select: { id: true, regNumber: true, name: true } },
                },
            }),
            prisma_1.default.vehicle.update({
                where: { id: vehicleId },
                data: { status: 'IN_SHOP' },
            }),
        ]);
        res.status(201).json(log);
    }
    catch (error) {
        console.error('CreateMaintenanceLog error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.createMaintenanceLog = createMaintenanceLog;
const closeMaintenanceLog = async (req, res) => {
    try {
        const id = req.params.id;
        const { endDate, cost } = req.body;
        const log = await prisma_1.default.maintenanceLog.findUnique({
            where: { id },
            include: { vehicle: true },
        });
        if (!log) {
            res.status(404).json({ error: 'Maintenance log not found.' });
            return;
        }
        if (log.status === 'CLOSED') {
            res.status(400).json({ error: 'Maintenance log is already closed.' });
            return;
        }
        const updateData = {
            status: 'CLOSED',
            endDate: endDate ? new Date(endDate) : new Date(),
        };
        if (cost !== undefined)
            updateData.cost = cost;
        // Check if vehicle should be restored to AVAILABLE (not if RETIRED)
        const restoreVehicle = log.vehicle.status === 'IN_SHOP';
        const updates = [
            prisma_1.default.maintenanceLog.update({
                where: { id },
                data: updateData,
                include: {
                    vehicle: { select: { id: true, regNumber: true, name: true } },
                },
            }),
        ];
        if (restoreVehicle) {
            // Check if there are other open maintenance logs for this vehicle
            const otherOpenLogs = await prisma_1.default.maintenanceLog.count({
                where: {
                    vehicleId: log.vehicleId,
                    id: { not: id },
                    status: { not: 'CLOSED' },
                },
            });
            if (otherOpenLogs === 0) {
                updates.push(prisma_1.default.vehicle.update({
                    where: { id: log.vehicleId },
                    data: { status: 'AVAILABLE' },
                }));
            }
        }
        const [updatedLog] = await prisma_1.default.$transaction(updates);
        res.json(updatedLog);
    }
    catch (error) {
        console.error('CloseMaintenanceLog error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.closeMaintenanceLog = closeMaintenanceLog;
//# sourceMappingURL=maintenance.controller.js.map