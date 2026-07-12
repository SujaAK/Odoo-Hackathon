import { Request, Response, NextFunction } from 'express';
export declare const allowRoles: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
