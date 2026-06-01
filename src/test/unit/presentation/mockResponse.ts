import { vi } from "vitest";
import type { Response } from "express";

export function mockResponse(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    sendStatus: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    locals: {} as Record<string, unknown>,
    headersSent: false,
  };
  return res as unknown as Response;
}
