"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activateDriver = exports.suspendDriver = exports.updateDriver = exports.createDriver = exports.getDriverById = exports.getAvailableDrivers = exports.getAllDrivers = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getAllDrivers = async (req, res) => {
    try {
        const { status } = req.query;
        const where = {};
        if (status)
            where.status = status;
        const drivers = await prisma_1.default.driver.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { trips: true },
                },
            },
        });
        res.json(drivers);
    }
    catch (error) {
        console.error('GetAllDrivers error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.getAllDrivers = getAllDrivers;
const getAvailableDrivers = async (_req, res) => {
    try {
        const drivers = await prisma_1.default.driver.findMany({
            where: {
                status: 'AVAILABLE',
                licenseExpiry: { gt: new Date() }, // License must not be expired
            },
            orderBy: { name: 'asc' },
        });
        res.json(drivers);
    }
    catch (error) {
        console.error('GetAvailableDrivers error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.getAvailableDrivers = getAvailableDrivers;
const getDriverById = async (req, res) => {
    try {
        const id = req.params.id;
        const driver = await prisma_1.default.driver.findUnique({
            where: { id },
            include: {
                trips: { orderBy: { createdAt: 'desc' }, take: 10 },
            },
        });
        if (!driver) {
            res.status(404).json({ error: 'Driver not found.' });
            return;
        }
        res.json(driver);
    }
    catch (error) {
        console.error('GetDriverById error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.getDriverById = getDriverById;
const createDriver = async (req, res) => {
    try {
        const { name, licenseNumber, licenseCategory, licenseExpiry, contact } = req.body;
        // Check for duplicate license number
        const existing = await prisma_1.default.driver.findUnique({ where: { licenseNumber } });
        if (existing) {
            res.status(400).json({ error: 'Driver with this license number already exists.' });
            return;
        }
        const driver = await prisma_1.default.driver.create({
            data: {
                name,
                licenseNumber,
                licenseCategory,
                licenseExpiry: new Date(licenseExpiry),
                contact,
            },
        });
        res.status(201).json(driver);
    }
    catch (error) {
        console.error('CreateDriver error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.createDriver = createDriver;
const updateDriver = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, licenseNumber, licenseCategory, licenseExpiry, contact, safetyScore, status } = req.body;
        const data = {};
        if (name !== undefined)
            data.name = name;
        if (licenseNumber !== undefined)
            data.licenseNumber = licenseNumber;
        if (licenseCategory !== undefined)
            data.licenseCategory = licenseCategory;
        if (licenseExpiry !== undefined)
            data.licenseExpiry = new Date(licenseExpiry);
        if (contact !== undefined)
            data.contact = contact;
        if (safetyScore !== undefined)
            data.safetyScore = safetyScore;
        if (status !== undefined)
            data.status = status;
        const driver = await prisma_1.default.driver.update({
            where: { id },
            data,
        });
        res.json(driver);
    }
    catch (error) {
        console.error('UpdateDriver error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.updateDriver = updateDriver;
const suspendDriver = async (req, res) => {
    try {
        const id = req.params.id;
        const driver = await prisma_1.default.driver.findUnique({ where: { id } });
        if (!driver) {
            res.status(404).json({ error: 'Driver not found.' });
            return;
        }
        if (driver.status === 'ON_TRIP') {
            res.status(400).json({ error: 'Cannot suspend a driver currently on a trip.' });
            return;
        }
        const updated = await prisma_1.default.driver.update({
            where: { id },
            data: { status: 'SUSPENDED' },
        });
        res.json(updated);
    }
    catch (error) {
        console.error('SuspendDriver error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.suspendDriver = suspendDriver;
const activateDriver = async (req, res) => {
    try {
        const id = req.params.id;
        const updated = await prisma_1.default.driver.update({
            where: { id },
            data: { status: 'AVAILABLE' },
        });
        res.json(updated);
    }
    catch (error) {
        console.error('ActivateDriver error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.activateDriver = activateDriver;
//# sourceMappingURL=driver.controller.js.map