import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllVehicles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type } = req.query;

    const where: any = {};
    if (status) where.status = status as string;
    if (type) where.type = type as string;

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { trips: true, maintenanceLogs: true },
        },
      },
    });

    res.json(vehicles);
  } catch (error) {
    console.error('GetAllVehicles error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getAvailableVehicles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { status: 'AVAILABLE' },
      orderBy: { name: 'asc' },
    });

    res.json(vehicles);
  } catch (error) {
    console.error('GetAvailableVehicles error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getVehicleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const vehicle = await prisma.vehicle.findUnique({
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
  } catch (error) {
    console.error('GetVehicleById error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const createVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { regNumber, name, type, maxLoad, odometer, acquisitionCost } = req.body;

    // Check for duplicate registration number
    const existing = await prisma.vehicle.findUnique({ where: { regNumber } });
    if (existing) {
      res.status(400).json({ error: 'Vehicle with this registration number already exists.' });
      return;
    }

    const vehicle = await prisma.vehicle.create({
      data: { regNumber, name, type, maxLoad, odometer: odometer || 0, acquisitionCost },
    });

    res.status(201).json(vehicle);
  } catch (error) {
    console.error('CreateVehicle error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { regNumber, name, type, maxLoad, odometer, acquisitionCost, status } = req.body;

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { regNumber, name, type, maxLoad, odometer, acquisitionCost, status },
    });

    res.json(vehicle);
  } catch (error) {
    console.error('UpdateVehicle error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const retireVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found.' });
      return;
    }

    if (vehicle.status === 'ON_TRIP') {
      res.status(400).json({ error: 'Cannot retire a vehicle that is currently on a trip.' });
      return;
    }

    const updated = await prisma.vehicle.update({
      where: { id },
      data: { status: 'RETIRED' },
    });

    res.json(updated);
  } catch (error) {
    console.error('RetireVehicle error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
