import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export const healthCheck = (_req: Request, res: Response): void => {
  res.status(StatusCodes.OK).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};
