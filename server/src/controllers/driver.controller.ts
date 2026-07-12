import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllDrivers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) where.status = status as string;

    const drivers = await prisma.driver.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { trips: true },
        },
      },
    });

    res.json(drivers);
  } catch (error) {
    console.error('GetAllDrivers error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getAvailableDrivers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const drivers = await prisma.driver.findMany({
      where: {
        status: 'AVAILABLE',
        licenseExpiry: { gt: new Date() }, // License must not be expired
      },
      orderBy: { name: 'asc' },
    });

    res.json(drivers);
  } catch (error) {
    console.error('GetAvailableDrivers error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getDriverById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const driver = await prisma.driver.findUnique({
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
  } catch (error) {
    console.error('GetDriverById error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const createDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, licenseNumber, licenseCategory, licenseExpiry, contact, userId } = req.body;

    // Check for duplicate license number
    const existing = await prisma.driver.findUnique({ where: { licenseNumber } });
    if (existing) {
      res.status(400).json({ error: 'Driver with this license number already exists.' });
      return;
    }

    // If userId provided, verify the user exists and has DRIVER role
    if (userId) {
      const linkedUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!linkedUser) {
        res.status(404).json({ error: 'Linked user account not found.' });
        return;
      }
      if (linkedUser.role !== 'DRIVER') {
        res.status(400).json({ error: 'Linked user must have the DRIVER role.' });
        return;
      }
      // Check if user is already linked to another driver
      const existingLink = await prisma.driver.findUnique({ where: { userId } });
      if (existingLink) {
        res.status(400).json({ error: 'This user account is already linked to another driver profile.' });
        return;
      }
    }

    const driver = await prisma.driver.create({
      data: {
        name,
        licenseNumber,
        licenseCategory,
        licenseExpiry: new Date(licenseExpiry),
        contact,
        ...(userId ? { userId } : {}),
      },
    });

    res.status(201).json(driver);
  } catch (error) {
    console.error('CreateDriver error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, licenseNumber, licenseCategory, licenseExpiry, contact, safetyScore, status, userId } = req.body;

    // If userId provided, verify the user exists, has DRIVER role, and is not already linked elsewhere
    if (userId) {
      const linkedUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!linkedUser) {
        res.status(404).json({ error: 'Linked user account not found.' });
        return;
      }
      if (linkedUser.role !== 'DRIVER') {
        res.status(400).json({ error: 'Linked user must have the DRIVER role.' });
        return;
      }
      const existingLink = await prisma.driver.findFirst({
        where: {
          userId,
          id: { not: id },
        },
      });
      if (existingLink) {
        res.status(400).json({ error: 'This user account is already linked to another driver profile.' });
        return;
      }
    }

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (licenseNumber !== undefined) data.licenseNumber = licenseNumber;
    if (licenseCategory !== undefined) data.licenseCategory = licenseCategory;
    if (licenseExpiry !== undefined) data.licenseExpiry = new Date(licenseExpiry);
    if (contact !== undefined) data.contact = contact;
    if (safetyScore !== undefined) data.safetyScore = safetyScore;
    if (status !== undefined) data.status = status;
    if (userId !== undefined) data.userId = userId || null;

    const driver = await prisma.driver.update({
      where: { id },
      data,
    });

    res.json(driver);
  } catch (error) {
    console.error('UpdateDriver error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getUnlinkedDriverUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: 'DRIVER',
        driverProfile: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (error) {
    console.error('GetUnlinkedDriverUsers error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const suspendDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const driver = await prisma.driver.findUnique({ where: { id } });
    if (!driver) {
      res.status(404).json({ error: 'Driver not found.' });
      return;
    }

    if (driver.status === 'ON_TRIP') {
      res.status(400).json({ error: 'Cannot suspend a driver currently on a trip.' });
      return;
    }

    const updated = await prisma.driver.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    });

    res.json(updated);
  } catch (error) {
    console.error('SuspendDriver error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const activateDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const updated = await prisma.driver.update({
      where: { id },
      data: { status: 'AVAILABLE' },
    });

    res.json(updated);
  } catch (error) {
    console.error('ActivateDriver error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
