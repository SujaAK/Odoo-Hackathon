import { Request, Response } from 'express';
export declare const getAllMaintenanceLogs: (req: Request, res: Response) => Promise<void>;
export declare const createMaintenanceLog: (req: Request, res: Response) => Promise<void>;
export declare const closeMaintenanceLog: (req: Request, res: Response) => Promise<void>;
