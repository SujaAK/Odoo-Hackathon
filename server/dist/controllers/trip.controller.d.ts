import { Request, Response } from 'express';
export declare const getAllTrips: (req: Request, res: Response) => Promise<void>;
export declare const createTrip: (req: Request, res: Response) => Promise<void>;
export declare const dispatchTrip: (req: Request, res: Response) => Promise<void>;
export declare const completeTrip: (req: Request, res: Response) => Promise<void>;
export declare const cancelTrip: (req: Request, res: Response) => Promise<void>;
