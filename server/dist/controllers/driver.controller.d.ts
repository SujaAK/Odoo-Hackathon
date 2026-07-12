import { Request, Response } from 'express';
export declare const getAllDrivers: (req: Request, res: Response) => Promise<void>;
export declare const getAvailableDrivers: (_req: Request, res: Response) => Promise<void>;
export declare const getDriverById: (req: Request, res: Response) => Promise<void>;
export declare const createDriver: (req: Request, res: Response) => Promise<void>;
export declare const updateDriver: (req: Request, res: Response) => Promise<void>;
export declare const suspendDriver: (req: Request, res: Response) => Promise<void>;
export declare const activateDriver: (req: Request, res: Response) => Promise<void>;
