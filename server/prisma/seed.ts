import { PrismaClient, Role, VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new pg.Pool({ connectionString: process.env.MIGRATE_URL || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Start seeding...');

  // 1. Clean database
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const manager = await prisma.user.create({
    data: {
      name: 'Alice Manager',
      email: 'manager@transitops.com',
      password: hashedPassword,
      role: Role.FLEET_MANAGER,
    },
  });

  const safety = await prisma.user.create({
    data: {
      name: 'Bob Safety',
      email: 'safety@transitops.com',
      password: hashedPassword,
      role: Role.SAFETY_OFFICER,
    },
  });

  const analyst = await prisma.user.create({
    data: {
      name: 'Charlie Analyst',
      email: 'analyst@transitops.com',
      password: hashedPassword,
      role: Role.FINANCIAL_ANALYST,
    },
  });

  const driverUser = await prisma.user.create({
    data: {
      name: 'David Driver',
      email: 'driver@transitops.com',
      password: hashedPassword,
      role: Role.DRIVER,
    },
  });

  console.log('✅ Users created:', { manager: manager.email, safety: safety.email, analyst: analyst.email, driverUser: driverUser.email });

  // 3. Create Vehicles
  const v1 = await prisma.vehicle.create({
    data: {
      regNumber: 'TO-1001',
      name: 'Volvo FH16 Globetrotter',
      type: 'Truck',
      maxLoad: 25000,
      odometer: 145000,
      acquisitionCost: 185000,
      region: 'North',
      status: VehicleStatus.AVAILABLE,
    },
  });

  const v2 = await prisma.vehicle.create({
    data: {
      regNumber: 'TO-1002',
      name: 'Mercedes-Benz Actros',
      type: 'Truck',
      maxLoad: 20000,
      odometer: 85000,
      acquisitionCost: 160000,
      region: 'South',
      status: VehicleStatus.ON_TRIP,
    },
  });

  const v3 = await prisma.vehicle.create({
    data: {
      regNumber: 'TO-1003',
      name: 'Scania R500 V8',
      type: 'Truck',
      maxLoad: 22000,
      odometer: 210000,
      acquisitionCost: 175000,
      region: 'East',
      status: VehicleStatus.IN_SHOP,
    },
  });

  const v4 = await prisma.vehicle.create({
    data: {
      regNumber: 'TO-1004',
      name: 'Toyota HiAce LWB',
      type: 'Van',
      maxLoad: 1200,
      odometer: 42000,
      acquisitionCost: 45000,
      region: 'West',
      status: VehicleStatus.AVAILABLE,
    },
  });

  console.log('✅ Vehicles created');

  // 4. Create Drivers
  const today = new Date();
  const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

  const d1 = await prisma.driver.create({
    data: {
      name: 'Michael Schumacher',
      licenseNumber: 'LIC-77001',
      licenseCategory: 'Heavy Rigid (HR)',
      licenseExpiry: nextYear,
      contact: '+61 412 345 678',
      safetyScore: 95,
      status: DriverStatus.AVAILABLE,
      userId: driverUser.id,
    },
  });

  const d2 = await prisma.driver.create({
    data: {
      name: 'Lewis Hamilton',
      licenseNumber: 'LIC-77002',
      licenseCategory: 'Multi-Combination (MC)',
      licenseExpiry: nextYear,
      contact: '+61 412 987 654',
      safetyScore: 98,
      status: DriverStatus.ON_TRIP,
    },
  });

  const d3 = await prisma.driver.create({
    data: {
      name: 'Max Verstappen',
      licenseNumber: 'LIC-77003',
      licenseCategory: 'Heavy Combination (HC)',
      licenseExpiry: nextYear,
      contact: '+61 411 222 333',
      safetyScore: 92,
      status: DriverStatus.OFF_DUTY,
    },
  });

  const d4 = await prisma.driver.create({
    data: {
      name: 'James Corden',
      licenseNumber: 'LIC-77004',
      licenseCategory: 'Medium Rigid (MR)',
      licenseExpiry: lastMonth, // Expired!
      contact: '+61 422 333 444',
      safetyScore: 50,
      status: DriverStatus.AVAILABLE,
    },
  });

  console.log('✅ Drivers created');

  // 5. Create Trips
  const trip1 = await prisma.trip.create({
    data: {
      source: 'Sydney Port',
      destination: 'Melbourne Logistics Hub',
      vehicleId: v2.id,
      driverId: d2.id,
      cargoWeight: 18500,
      plannedDistance: 870,
      status: TripStatus.DISPATCHED,
    },
  });

  const trip2 = await prisma.trip.create({
    data: {
      source: 'Brisbane Depot',
      destination: 'Sydney Depot',
      vehicleId: v1.id,
      driverId: d1.id,
      cargoWeight: 14000,
      plannedDistance: 920,
      actualDistance: 924,
      fuelConsumed: 280,
      revenue: 4500,
      status: TripStatus.COMPLETED,
    },
  });

  console.log('✅ Trips created');

  // 6. Create Maintenance Logs
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: v3.id,
      type: 'Engine Repair',
      description: 'Scheduled alternator replacement and transmission diagnostics due to warning light.',
      cost: 1450,
      startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3),
      status: MaintenanceStatus.IN_PROGRESS,
    },
  });

  await prisma.maintenanceLog.create({
    data: {
      vehicleId: v1.id,
      type: 'Routine Service',
      description: 'Standard 100k service: engine oil, air filter, and brake pads replacement.',
      cost: 650,
      startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 15),
      endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14),
      status: MaintenanceStatus.CLOSED,
    },
  });

  console.log('✅ Maintenance logs created');

  // 7. Create Fuel Logs
  await prisma.fuelLog.create({
    data: {
      vehicleId: v1.id,
      liters: 320,
      cost: 640,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5),
    },
  });

  await prisma.fuelLog.create({
    data: {
      vehicleId: v2.id,
      liters: 280,
      cost: 560,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2),
    },
  });

  console.log('✅ Fuel logs created');

  // 8. Create Expenses
  await prisma.expense.create({
    data: {
      vehicleId: v1.id,
      type: 'Tolls',
      amount: 145,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5),
      description: 'M5 motorway toll fees return trip',
    },
  });

  await prisma.expense.create({
    data: {
      vehicleId: v2.id,
      type: 'Registration Fees',
      amount: 850,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30),
      description: 'Annual registration renewal toll',
    },
  });

  console.log('✅ Expenses created');
  console.log('🌱 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
