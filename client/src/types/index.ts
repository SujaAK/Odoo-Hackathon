// ─── User & Auth ─────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'FLEET_MANAGER' | 'DRIVER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';
  avatar?: string | null;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ─── Vehicle ─────────────────────────────────────────────

export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';

export interface Vehicle {
  id: string;
  regNumber: string;
  name: string;
  type: string;
  maxLoad: number;
  odometer: number;
  acquisitionCost: number;
  region: string;
  status: VehicleStatus;
  createdAt: string;
  _count?: {
    trips: number;
    maintenanceLogs: number;
  };
}

// ─── Driver ──────────────────────────────────────────────

export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  contact: string;
  safetyScore: number;
  status: DriverStatus;
  createdAt: string;
  userId?: string | null;
  user?: User | null;
  _count?: {
    trips: number;
  };
}

// ─── Trip ────────────────────────────────────────────────

export type TripStatus = 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDistance: number;
  actualDistance: number | null;
  fuelConsumed: number | null;
  revenue: number;
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
  vehicle: {
    id: string;
    regNumber: string;
    name: string;
    type?: string;
  };
  driver: {
    id: string;
    name: string;
    licenseNumber?: string;
  };
}

// ─── Maintenance ─────────────────────────────────────────

export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  type: string;
  description: string;
  cost: number;
  startDate: string;
  endDate: string | null;
  status: MaintenanceStatus;
  createdAt: string;
  vehicle: {
    id: string;
    regNumber: string;
    name: string;
  };
}

// ─── Fuel & Expense ──────────────────────────────────────

export interface FuelLog {
  id: string;
  vehicleId: string;
  liters: number;
  cost: number;
  date: string;
  createdAt: string;
  vehicle: {
    id: string;
    regNumber: string;
    name: string;
  };
}

export interface Expense {
  id: string;
  vehicleId: string;
  type: string;
  amount: number;
  date: string;
  description: string | null;
  createdAt: string;
  vehicle: {
    id: string;
    regNumber: string;
    name: string;
  };
}

// ─── Dashboard ───────────────────────────────────────────

export interface DashboardKPIs {
  totalVehicles: number;
  availableVehicles: number;
  onTripVehicles: number;
  inShopVehicles: number;
  retiredVehicles: number;
  totalDrivers: number;
  onTripDrivers: number;
  draftTrips: number;
  dispatchedTrips: number;
  completedTrips: number;
  fleetUtilization: number;
  filterOptions: {
    vehicleTypes: string[];
    regions: string[];
  };
}

// ─── Reports ─────────────────────────────────────────────

export interface FuelEfficiencyReport {
  vehicleId: string;
  regNumber: string;
  name: string;
  totalDistance: number;
  totalFuel: number;
  efficiency: number;
  tripCount: number;
}

export interface OperationalCostReport {
  vehicleId: string;
  regNumber: string;
  name: string;
  fuelCost: number;
  maintenanceCost: number;
  otherExpenses: number;
  totalCost: number;
}

export interface VehicleROIReport {
  vehicleId: string;
  regNumber: string;
  name: string;
  acquisitionCost: number;
  totalOperationalCost: number;
  completedTrips: number;
  roi: number;
}
