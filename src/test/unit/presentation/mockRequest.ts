import type { Request } from "express";

export function mockRequest(overrides?: Partial<Request>): Request {
  return {
    params: {},
    body: {},
    cookies: {},
    headers: {},
    secure: false,
    ...overrides,
  } as Request;
}
