"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCSV = exports.getFleetUtilization = exports.getVehicleROI = exports.getOperationalCost = exports.getFuelEfficiency = exports.getRecentTrips = exports.getDashboardKPIs = exports.createExpense = exports.getAllExpenses = exports.createFuelLog = exports.getAllFuelLogs = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// ─── Fuel Logs ───────────────────────────────────────────
const getAllFuelLogs = async (req, res) => {
    try {
        const { vehicleId } = req.query;
        const where = {};
        if (vehicleId)
            where.vehicleId = vehicleId;
        const fuelLogs = await prisma_1.default.fuelLog.findMany({
            where,
            orderBy: { date: 'desc' },
            include: {
                vehicle: { select: { id: true, regNumber: true, name: true } },
            },
        });
        res.json(fuelLogs);
    }
    catch (error) {
        console.error('GetAllFuelLogs error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.getAllFuelLogs = getAllFuelLogs;
const createFuelLog = async (req, res) => {
    try {
        const { vehicleId, liters, cost, date } = req.body;
        const vehicle = await prisma_1.default.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle) {
            res.status(404).json({ error: 'Vehicle not found.' });
            return;
        }
        const fuelLog = await prisma_1.default.fuelLog.create({
            data: {
                vehicleId,
                liters,
                cost,
                date: new Date(date),
            },
            include: {
                vehicle: { select: { id: true, regNumber: true, name: true } },
            },
        });
        res.status(201).json(fuelLog);
    }
    catch (error) {
        console.error('CreateFuelLog error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.createFuelLog = createFuelLog;
// ─── Expenses ────────────────────────────────────────────
const getAllExpenses = async (req, res) => {
    try {
        const { vehicleId, type } = req.query;
        const where = {};
        if (vehicleId)
            where.vehicleId = vehicleId;
        if (type)
            where.type = type;
        const expenses = await prisma_1.default.expense.findMany({
            where,
            orderBy: { date: 'desc' },
            include: {
                vehicle: { select: { id: true, regNumber: true, name: true } },
            },
        });
        res.json(expenses);
    }
    catch (error) {
        console.error('GetAllExpenses error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.getAllExpenses = getAllExpenses;
const createExpense = async (req, res) => {
    try {
        const { vehicleId, type, amount, date, description } = req.body;
        const vehicle = await prisma_1.default.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle) {
            res.status(404).json({ error: 'Vehicle not found.' });
            return;
        }
        const expense = await prisma_1.default.expense.create({
            data: {
                vehicleId,
                type,
                amount,
                date: new Date(date),
                description,
            },
            include: {
                vehicle: { select: { id: true, regNumber: true, name: true } },
            },
        });
        res.status(201).json(expense);
    }
    catch (error) {
        console.error('CreateExpense error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.createExpense = createExpense;
// ─── Dashboard KPIs ──────────────────────────────────────
const getDashboardKPIs = async (_req, res) => {
    try {
        const [totalVehicles, availableVehicles, onTripVehicles, inShopVehicles, retiredVehicles, totalDrivers, onTripDrivers, draftTrips, dispatchedTrips, completedTrips,] = await Promise.all([
            prisma_1.default.vehicle.count(),
            prisma_1.default.vehicle.count({ where: { status: 'AVAILABLE' } }),
            prisma_1.default.vehicle.count({ where: { status: 'ON_TRIP' } }),
            prisma_1.default.vehicle.count({ where: { status: 'IN_SHOP' } }),
            prisma_1.default.vehicle.count({ where: { status: 'RETIRED' } }),
            prisma_1.default.driver.count(),
            prisma_1.default.driver.count({ where: { status: 'ON_TRIP' } }),
            prisma_1.default.trip.count({ where: { status: 'DRAFT' } }),
            prisma_1.default.trip.count({ where: { status: 'DISPATCHED' } }),
            prisma_1.default.trip.count({ where: { status: 'COMPLETED' } }),
        ]);
        const activeVehicles = totalVehicles - retiredVehicles;
        const fleetUtilization = activeVehicles > 0
            ? Math.round((onTripVehicles / activeVehicles) * 100)
            : 0;
        res.json({
            totalVehicles,
            availableVehicles,
            onTripVehicles,
            inShopVehicles,
            retiredVehicles,
            totalDrivers,
            onTripDrivers,
            draftTrips,
            dispatchedTrips,
            completedTrips,
            fleetUtilization,
        });
    }
    catch (error) {
        console.error('GetDashboardKPIs error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.getDashboardKPIs = getDashboardKPIs;
// ─── Recent Trips ────────────────────────────────────────
const getRecentTrips = async (_req, res) => {
    try {
        const trips = await prisma_1.default.trip.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                vehicle: { select: { id: true, regNumber: true, name: true } },
                driver: { select: { id: true, name: true } },
            },
        });
        res.json(trips);
    }
    catch (error) {
        console.error('GetRecentTrips error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.getRecentTrips = getRecentTrips;
// ─── Reports ─────────────────────────────────────────────
const getFuelEfficiency = async (_req, res) => {
    try {
        const vehicles = await prisma_1.default.vehicle.findMany({
            where: { status: { not: 'RETIRED' } },
            include: {
                trips: {
                    where: { status: 'COMPLETED', actualDistance: { not: null }, fuelConsumed: { not: null } },
                    select: { actualDistance: true, fuelConsumed: true },
                },
            },
        });
        const report = vehicles.map((v) => {
            const totalDistance = v.trips.reduce((sum, t) => sum + (t.actualDistance || 0), 0);
            const totalFuel = v.trips.reduce((sum, t) => sum + (t.fuelConsumed || 0), 0);
            const efficiency = totalFuel > 0 ? Math.round((totalDistance / totalFuel) * 100) / 100 : 0;
            return {
                vehicleId: v.id,
                regNumber: v.regNumber,
                name: v.name,
                totalDistance,
                totalFuel,
                efficiency, // km per liter
                tripCount: v.trips.length,
            };
        });
        res.json(report);
    }
    catch (error) {
        console.error('GetFuelEfficiency error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.getFuelEfficiency = getFuelEfficiency;
const getOperationalCost = async (_req, res) => {
    try {
        const vehicles = await prisma_1.default.vehicle.findMany({
            include: {
                fuelLogs: { select: { cost: true } },
                maintenanceLogs: { select: { cost: true } },
                expenses: { select: { amount: true } },
            },
        });
        const report = vehicles.map((v) => {
            const fuelCost = v.fuelLogs.reduce((sum, f) => sum + f.cost, 0);
            const maintenanceCost = v.maintenanceLogs.reduce((sum, m) => sum + m.cost, 0);
            const otherExpenses = v.expenses.reduce((sum, e) => sum + e.amount, 0);
            const totalCost = fuelCost + maintenanceCost + otherExpenses;
            return {
                vehicleId: v.id,
                regNumber: v.regNumber,
                name: v.name,
                fuelCost: Math.round(fuelCost * 100) / 100,
                maintenanceCost: Math.round(maintenanceCost * 100) / 100,
                otherExpenses: Math.round(otherExpenses * 100) / 100,
                totalCost: Math.round(totalCost * 100) / 100,
            };
        });
        res.json(report);
    }
    catch (error) {
        console.error('GetOperationalCost error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.getOperationalCost = getOperationalCost;
const getVehicleROI = async (_req, res) => {
    try {
        const vehicles = await prisma_1.default.vehicle.findMany({
            include: {
                fuelLogs: { select: { cost: true } },
                maintenanceLogs: { select: { cost: true } },
                expenses: { select: { amount: true } },
                trips: { where: { status: 'COMPLETED' }, select: { id: true } },
            },
        });
        const report = vehicles.map((v) => {
            const fuelCost = v.fuelLogs.reduce((sum, f) => sum + f.cost, 0);
            const maintenanceCost = v.maintenanceLogs.reduce((sum, m) => sum + m.cost, 0);
            const otherExpenses = v.expenses.reduce((sum, e) => sum + e.amount, 0);
            const totalCost = fuelCost + maintenanceCost + otherExpenses;
            const roi = v.acquisitionCost > 0
                ? Math.round(((0 - totalCost) / v.acquisitionCost) * 10000) / 100 // percentage
                : 0;
            return {
                vehicleId: v.id,
                regNumber: v.regNumber,
                name: v.name,
                acquisitionCost: v.acquisitionCost,
                totalOperationalCost: Math.round(totalCost * 100) / 100,
                completedTrips: v.trips.length,
                roi,
            };
        });
        res.json(report);
    }
    catch (error) {
        console.error('GetVehicleROI error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.getVehicleROI = getVehicleROI;
const getFleetUtilization = async (_req, res) => {
    try {
        const totalActive = await prisma_1.default.vehicle.count({ where: { status: { not: 'RETIRED' } } });
        const onTrip = await prisma_1.default.vehicle.count({ where: { status: 'ON_TRIP' } });
        const inShop = await prisma_1.default.vehicle.count({ where: { status: 'IN_SHOP' } });
        const available = await prisma_1.default.vehicle.count({ where: { status: 'AVAILABLE' } });
        const utilizationRate = totalActive > 0
            ? Math.round((onTrip / totalActive) * 100)
            : 0;
        res.json({
            totalActive,
            onTrip,
            inShop,
            available,
            utilizationRate,
        });
    }
    catch (error) {
        console.error('GetFleetUtilization error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.getFleetUtilization = getFleetUtilization;
// ─── CSV Export ──────────────────────────────────────────
const exportCSV = async (req, res) => {
    try {
        const { type } = req.params;
        let data = [];
        let headers = [];
        switch (type) {
            case 'vehicles': {
                headers = ['Reg Number', 'Name', 'Type', 'Max Load', 'Odometer', 'Acquisition Cost', 'Status'];
                const vehicles = await prisma_1.default.vehicle.findMany();
                data = vehicles.map((v) => [v.regNumber, v.name, v.type, v.maxLoad, v.odometer, v.acquisitionCost, v.status]);
                break;
            }
            case 'drivers': {
                headers = ['Name', 'License Number', 'License Category', 'License Expiry', 'Contact', 'Safety Score', 'Status'];
                const drivers = await prisma_1.default.driver.findMany();
                data = drivers.map((d) => [d.name, d.licenseNumber, d.licenseCategory, d.licenseExpiry.toISOString().split('T')[0], d.contact, d.safetyScore, d.status]);
                break;
            }
            case 'trips': {
                headers = ['Source', 'Destination', 'Vehicle', 'Driver', 'Cargo Weight', 'Planned Distance', 'Actual Distance', 'Fuel Consumed', 'Status', 'Created At'];
                const trips = await prisma_1.default.trip.findMany({ include: { vehicle: true, driver: true } });
                data = trips.map((t) => [t.source, t.destination, t.vehicle.regNumber, t.driver.name, t.cargoWeight, t.plannedDistance, t.actualDistance || '', t.fuelConsumed || '', t.status, t.createdAt.toISOString().split('T')[0]]);
                break;
            }
            case 'fuel': {
                headers = ['Vehicle', 'Liters', 'Cost', 'Date'];
                const fuelLogs = await prisma_1.default.fuelLog.findMany({ include: { vehicle: true } });
                data = fuelLogs.map((f) => [f.vehicle.regNumber, f.liters, f.cost, f.date.toISOString().split('T')[0]]);
                break;
            }
            case 'expenses': {
                headers = ['Vehicle', 'Type', 'Amount', 'Date', 'Description'];
                const expenses = await prisma_1.default.expense.findMany({ include: { vehicle: true } });
                data = expenses.map((e) => [e.vehicle.regNumber, e.type, e.amount, e.date.toISOString().split('T')[0], e.description || '']);
                break;
            }
            case 'maintenance': {
                headers = ['Vehicle', 'Type', 'Description', 'Cost', 'Start Date', 'End Date', 'Status'];
                const logs = await prisma_1.default.maintenanceLog.findMany({ include: { vehicle: true } });
                data = logs.map((l) => [l.vehicle.regNumber, l.type, l.description, l.cost, l.startDate.toISOString().split('T')[0], l.endDate ? l.endDate.toISOString().split('T')[0] : '', l.status]);
                break;
            }
            default:
                res.status(400).json({ error: 'Invalid export type.' });
                return;
        }
        const csv = [headers.join(','), ...data.map(row => row.map((cell) => `"${cell}"`).join(','))].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${type}-export.csv`);
        res.send(csv);
    }
    catch (error) {
        console.error('ExportCSV error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
exports.exportCSV = exportCSV;
//# sourceMappingURL=fuel.controller.js.map