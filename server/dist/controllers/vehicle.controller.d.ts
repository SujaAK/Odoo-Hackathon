import { Request, Response } from 'express';
export declare const getAllVehicles: (req: Request, res: Response) => Promise<void>;
export declare const getAvailableVehicles: (_req: Request, res: Response) => Promise<void>;
export declare const getVehicleById: (req: Request, res: Response) => Promise<void>;
export declare const createVehicle: (req: Request, res: Response) => Promise<void>;
export declare const updateVehicle: (req: Request, res: Response) => Promise<void>;
export declare const retireVehicle: (req: Request, res: Response) => Promise<void>;
