"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retireVehicle = exports.updateVehicle = exports.createVehicle = exports.getVehicleById = exports.getAvailableVehicles = exports.getAllVehicles = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getAllVehicles = async (req, res) => {
    try {
        const { status, type } = req.query;
        const where = {};
        if (status)
            where.status = status;
        if (type)
            where.type = type;
        const vehicles = await prisma_1.default.vehicle.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { trips: true, maintenanceLogs: true },
                },
            },
        });
        res.json(vehicles);
    }
    catch (error) {
        console.error('GetAllVehicles error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.getAllVehicles = getAllVehicles;
const getAvailableVehicles = async (_req, res) => {
    try {
        const vehicles = await prisma_1.default.vehicle.findMany({
            where: { status: 'AVAILABLE' },
            orderBy: { name: 'asc' },
        });
        res.json(vehicles);
    }
    catch (error) {
        console.error('GetAvailableVehicles error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.getAvailableVehicles = getAvailableVehicles;
const getVehicleById = async (req, res) => {
    try {
        const id = req.params.id;
        const vehicle = await prisma_1.default.vehicle.findUnique({
            where: { id },
            include: {
                trips: { orderBy: { createdAt: 'desc' }, take: 5 },
                maintenanceLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
                fuelLogs: { orderBy: { date: 'desc' }, take: 5 },
                expenses: { orderBy: { date: 'desc' }, take: 5 },
            },
        });
        if (!vehicle) {
            res.status(404).json({ error: 'Vehicle not found.' });
            return;
        }
        res.json(vehicle);
    }
    catch (error) {
        console.error('GetVehicleById error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.getVehicleById = getVehicleById;
const createVehicle = async (req, res) => {
    try {
        const { regNumber, name, type, maxLoad, odometer, acquisitionCost } = req.body;
        // Check for duplicate registration number
        const existing = await prisma_1.default.vehicle.findUnique({ where: { regNumber } });
        if (existing) {
            res.status(400).json({ error: 'Vehicle with this registration number already exists.' });
            return;
        }
        const vehicle = await prisma_1.default.vehicle.create({
            data: { regNumber, name, type, maxLoad, odometer: odometer || 0, acquisitionCost },
        });
        res.status(201).json(vehicle);
    }
    catch (error) {
        console.error('CreateVehicle error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.createVehicle = createVehicle;
const updateVehicle = async (req, res) => {
    try {
        const id = req.params.id;
        const { regNumber, name, type, maxLoad, odometer, acquisitionCost, status } = req.body;
        const vehicle = await prisma_1.default.vehicle.update({
            where: { id },
            data: { regNumber, name, type, maxLoad, odometer, acquisitionCost, status },
        });
        res.json(vehicle);
    }
    catch (error) {
        console.error('UpdateVehicle error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.updateVehicle = updateVehicle;
const retireVehicle = async (req, res) => {
    try {
        const id = req.params.id;
        const vehicle = await prisma_1.default.vehicle.findUnique({ where: { id } });
        if (!vehicle) {
            res.status(404).json({ error: 'Vehicle not found.' });
            return;
        }
        if (vehicle.status === 'ON_TRIP') {
            res.status(400).json({ error: 'Cannot retire a vehicle that is currently on a trip.' });
            return;
        }
        const updated = await prisma_1.default.vehicle.update({
            where: { id },
            data: { status: 'RETIRED' },
        });
        res.json(updated);
    }
    catch (error) {
        console.error('RetireVehicle error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.retireVehicle = retireVehicle;
//# sourceMappingURL=vehicle.controller.js.map