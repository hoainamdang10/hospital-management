import { NextFunction, Request, Response } from "express";
export declare const errorHandler: (error: Error, req: Request, res: Response, next: NextFunction) => void;
