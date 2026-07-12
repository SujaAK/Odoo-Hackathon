import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllTrips = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) where.status = status as string;

    // If the user is a DRIVER, only show trips assigned to their linked driver profile
    if (req.user?.role === 'DRIVER') {
      const driverProfile = await prisma.driver.findUnique({ where: { userId: req.user.id } });
      if (driverProfile) {
        where.driverId = driverProfile.id;
      } else {
        // Driver user has no linked profile — return empty
        res.json([]);
        return;
      }
    }

    const trips = await prisma.trip.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: { select: { id: true, regNumber: true, name: true, type: true } },
        driver: { select: { id: true, name: true, licenseNumber: true } },
      },
    });

    res.json(trips);
  } catch (error) {
    console.error('GetAllTrips error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const createTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const { source, destination, vehicleId, driverId, cargoWeight, plannedDistance } = req.body;

    // Fetch vehicle and driver
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });

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

    const trip = await prisma.trip.create({
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
  } catch (error) {
    console.error('CreateTrip error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const dispatchTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const trip = await prisma.trip.findUnique({
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
    const [updatedTrip] = await prisma.$transaction([
      prisma.trip.update({
        where: { id },
        data: { status: 'DISPATCHED' },
        include: {
          vehicle: { select: { id: true, regNumber: true, name: true } },
          driver: { select: { id: true, name: true } },
        },
      }),
      prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: 'ON_TRIP' },
      }),
      prisma.driver.update({
        where: { id: trip.driverId },
        data: { status: 'ON_TRIP' },
      }),
    ]);

    res.json(updatedTrip);
  } catch (error) {
    console.error('DispatchTrip error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const completeTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { actualDistance, fuelConsumed, revenue } = req.body;

    const trip = await prisma.trip.findUnique({ where: { id } });

    if (!trip) {
      res.status(404).json({ error: 'Trip not found.' });
      return;
    }

    if (trip.status !== 'DISPATCHED') {
      res.status(400).json({ error: `Cannot complete a trip with status ${trip.status}. Only DISPATCHED trips can be completed.` });
      return;
    }

    // Transaction: update trip, vehicle, and driver atomically
    const [updatedTrip] = await prisma.$transaction([
      prisma.trip.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          actualDistance: actualDistance || null,
          fuelConsumed: fuelConsumed || null,
          revenue: revenue || 0,
        },
        include: {
          vehicle: { select: { id: true, regNumber: true, name: true } },
          driver: { select: { id: true, name: true } },
        },
      }),
      prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: 'AVAILABLE' },
      }),
      prisma.driver.update({
        where: { id: trip.driverId },
        data: { status: 'AVAILABLE' },
      }),
    ]);

    res.json(updatedTrip);
  } catch (error) {
    console.error('CompleteTrip error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const cancelTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const trip = await prisma.trip.findUnique({ where: { id } });

    if (!trip) {
      res.status(404).json({ error: 'Trip not found.' });
      return;
    }

    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      res.status(400).json({ error: `Cannot cancel a trip with status ${trip.status}.` });
      return;
    }

    const updates: any[] = [
      prisma.trip.update({
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
      updates.push(
        prisma.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: 'AVAILABLE' },
        }),
        prisma.driver.update({
          where: { id: trip.driverId },
          data: { status: 'AVAILABLE' },
        }),
      );
    }

    const [updatedTrip] = await prisma.$transaction(updates);

    res.json(updatedTrip);
  } catch (error) {
    console.error('CancelTrip error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
