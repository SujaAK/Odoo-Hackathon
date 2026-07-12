import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// ─── Fuel Logs ───────────────────────────────────────────

export const getAllFuelLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicleId } = req.query;

    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId as string;

    const fuelLogs = await prisma.fuelLog.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        vehicle: { select: { id: true, regNumber: true, name: true } },
      },
    });

    res.json(fuelLogs);
  } catch (error) {
    console.error('GetAllFuelLogs error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const createFuelLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicleId, liters, cost, date } = req.body;

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found.' });
      return;
    }

    const fuelLog = await prisma.fuelLog.create({
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
  } catch (error) {
    console.error('CreateFuelLog error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// ─── Expenses ────────────────────────────────────────────

export const getAllExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicleId, type } = req.query;

    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId as string;
    if (type) where.type = type as string;

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        vehicle: { select: { id: true, regNumber: true, name: true } },
      },
    });

    res.json(expenses);
  } catch (error) {
    console.error('GetAllExpenses error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const createExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicleId, type, amount, date, description } = req.body;

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found.' });
      return;
    }

    const expense = await prisma.expense.create({
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
  } catch (error) {
    console.error('CreateExpense error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// ─── Dashboard KPIs ──────────────────────────────────────

export const getDashboardKPIs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicleType, status, region } = req.query;

    // Build a base vehicle filter from query params
    const vehicleFilter: any = {};
    if (vehicleType) vehicleFilter.type = vehicleType as string;
    if (region) vehicleFilter.region = region as string;
    // 'status' filter is used for narrowing the overview, not per-status counts
    if (status) vehicleFilter.status = status as string;

    const [
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
    ] = await Promise.all([
      prisma.vehicle.count({ where: vehicleFilter }),
      prisma.vehicle.count({ where: { ...vehicleFilter, status: 'AVAILABLE' } }),
      prisma.vehicle.count({ where: { ...vehicleFilter, status: 'ON_TRIP' } }),
      prisma.vehicle.count({ where: { ...vehicleFilter, status: 'IN_SHOP' } }),
      prisma.vehicle.count({ where: { ...vehicleFilter, status: 'RETIRED' } }),
      prisma.driver.count(),
      prisma.driver.count({ where: { status: 'ON_TRIP' } }),
      prisma.trip.count({ where: { status: 'DRAFT' } }),
      prisma.trip.count({ where: { status: 'DISPATCHED' } }),
      prisma.trip.count({ where: { status: 'COMPLETED' } }),
    ]);

    // Fetch distinct vehicle types and regions for filter dropdowns
    const vehicleTypes = await prisma.vehicle.findMany({
      select: { type: true },
      distinct: ['type'],
      orderBy: { type: 'asc' },
    });
    const regions = await prisma.vehicle.findMany({
      select: { region: true },
      distinct: ['region'],
      orderBy: { region: 'asc' },
    });

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
      filterOptions: {
        vehicleTypes: vehicleTypes.map((v: any) => v.type),
        regions: regions.map((r: any) => r.region),
      },
    });
  } catch (error) {
    console.error('GetDashboardKPIs error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// ─── Recent Trips ────────────────────────────────────────

export const getRecentTrips = async (_req: Request, res: Response): Promise<void> => {
  try {
    const trips = await prisma.trip.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        vehicle: { select: { id: true, regNumber: true, name: true } },
        driver: { select: { id: true, name: true } },
      },
    });

    res.json(trips);
  } catch (error) {
    console.error('GetRecentTrips error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// ─── Reports ─────────────────────────────────────────────

export const getFuelEfficiency = async (_req: Request, res: Response): Promise<void> => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { status: { not: 'RETIRED' } },
      include: {
        trips: {
          where: { status: 'COMPLETED', actualDistance: { not: null }, fuelConsumed: { not: null } },
          select: { actualDistance: true, fuelConsumed: true },
        },
      },
    });

    const report = vehicles.map((v: any) => {
      const totalDistance = v.trips.reduce((sum: number, t: any) => sum + (t.actualDistance || 0), 0);
      const totalFuel = v.trips.reduce((sum: number, t: any) => sum + (t.fuelConsumed || 0), 0);
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
  } catch (error) {
    console.error('GetFuelEfficiency error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getOperationalCost = async (_req: Request, res: Response): Promise<void> => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        fuelLogs: { select: { cost: true } },
        maintenanceLogs: { select: { cost: true } },
        expenses: { select: { amount: true } },
      },
    });

    const report = vehicles.map((v: any) => {
      const fuelCost = v.fuelLogs.reduce((sum: number, f: any) => sum + f.cost, 0);
      const maintenanceCost = v.maintenanceLogs.reduce((sum: number, m: any) => sum + m.cost, 0);
      const otherExpenses = v.expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
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
  } catch (error) {
    console.error('GetOperationalCost error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getVehicleROI = async (_req: Request, res: Response): Promise<void> => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        fuelLogs: { select: { cost: true } },
        maintenanceLogs: { select: { cost: true } },
        expenses: { select: { amount: true } },
        trips: { where: { status: 'COMPLETED' }, select: { id: true, revenue: true } },
      },
    });

    const report = vehicles.map((v: any) => {
      const fuelCost = v.fuelLogs.reduce((sum: number, f: any) => sum + f.cost, 0);
      const maintenanceCost = v.maintenanceLogs.reduce((sum: number, m: any) => sum + m.cost, 0);
      const otherExpenses = v.expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
      const totalCost = fuelCost + maintenanceCost + otherExpenses;
      const totalRevenue = v.trips.reduce((sum: number, t: any) => sum + (t.revenue || 0), 0);
      const roi = v.acquisitionCost > 0
        ? Math.round(((totalRevenue - totalCost) / v.acquisitionCost) * 10000) / 100 // percentage
        : 0;

      return {
        vehicleId: v.id,
        regNumber: v.regNumber,
        name: v.name,
        acquisitionCost: v.acquisitionCost,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOperationalCost: Math.round(totalCost * 100) / 100,
        completedTrips: v.trips.length,
        roi,
      };
    });

    res.json(report);
  } catch (error) {
    console.error('GetVehicleROI error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getFleetUtilization = async (_req: Request, res: Response): Promise<void> => {
  try {
    const totalActive = await prisma.vehicle.count({ where: { status: { not: 'RETIRED' } } });
    const onTrip = await prisma.vehicle.count({ where: { status: 'ON_TRIP' } });
    const inShop = await prisma.vehicle.count({ where: { status: 'IN_SHOP' } });
    const available = await prisma.vehicle.count({ where: { status: 'AVAILABLE' } });

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
  } catch (error) {
    console.error('GetFleetUtilization error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// ─── CSV Export ──────────────────────────────────────────

export const exportCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.params;

    let data: any[] = [];
    let headers: string[] = [];

    switch (type) {
      case 'vehicles': {
        headers = ['Reg Number', 'Name', 'Type', 'Max Load', 'Odometer', 'Acquisition Cost', 'Status'];
        const vehicles = await prisma.vehicle.findMany();
        data = vehicles.map((v: any) => [v.regNumber, v.name, v.type, v.maxLoad, v.odometer, v.acquisitionCost, v.status]);
        break;
      }
      case 'drivers': {
        headers = ['Name', 'License Number', 'License Category', 'License Expiry', 'Contact', 'Safety Score', 'Status'];
        const drivers = await prisma.driver.findMany();
        data = drivers.map((d: any) => [d.name, d.licenseNumber, d.licenseCategory, d.licenseExpiry.toISOString().split('T')[0], d.contact, d.safetyScore, d.status]);
        break;
      }
      case 'trips': {
        headers = ['Source', 'Destination', 'Vehicle', 'Driver', 'Cargo Weight', 'Planned Distance', 'Actual Distance', 'Fuel Consumed', 'Status', 'Created At'];
        const trips = await prisma.trip.findMany({ include: { vehicle: true, driver: true } });
        data = trips.map((t: any) => [t.source, t.destination, t.vehicle.regNumber, t.driver.name, t.cargoWeight, t.plannedDistance, t.actualDistance || '', t.fuelConsumed || '', t.status, t.createdAt.toISOString().split('T')[0]]);
        break;
      }
      case 'fuel': {
        headers = ['Vehicle', 'Liters', 'Cost', 'Date'];
        const fuelLogs = await prisma.fuelLog.findMany({ include: { vehicle: true } });
        data = fuelLogs.map((f: any) => [f.vehicle.regNumber, f.liters, f.cost, f.date.toISOString().split('T')[0]]);
        break;
      }
      case 'expenses': {
        headers = ['Vehicle', 'Type', 'Amount', 'Date', 'Description'];
        const expenses = await prisma.expense.findMany({ include: { vehicle: true } });
        data = expenses.map((e: any) => [e.vehicle.regNumber, e.type, e.amount, e.date.toISOString().split('T')[0], e.description || '']);
        break;
      }
      case 'maintenance': {
        headers = ['Vehicle', 'Type', 'Description', 'Cost', 'Start Date', 'End Date', 'Status'];
        const logs = await prisma.maintenanceLog.findMany({ include: { vehicle: true } });
        data = logs.map((l: any) => [l.vehicle.regNumber, l.type, l.description, l.cost, l.startDate.toISOString().split('T')[0], l.endDate ? l.endDate.toISOString().split('T')[0] : '', l.status]);
        break;
      }
      default:
        res.status(400).json({ error: 'Invalid export type.' });
        return;
    }

    const csv = [headers.join(','), ...data.map(row => row.map((cell: any) => `"${cell}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-export.csv`);
    res.send(csv);
  } catch (error) {
    console.error('ExportCSV error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
