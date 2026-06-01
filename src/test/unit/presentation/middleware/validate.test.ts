import type { NextFunction } from "express";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { validate } from "@presentation/rest/middlewares/validate";
import { mockRequest } from "@test/unit/presentation/mockRequest";
import { mockResponse } from "@test/unit/presentation/mockResponse";

const schema = z.object({
  params: z.object({ id: z.string().nonempty() }),
  body: z.object({
    name: z.string().nonempty(),
    color: z.string().nonempty(),
  }),
});

const validParams = { id: "zone-living-room" };
const validBody = { name: "Living Room", color: "#FF8800" };

describe("validate() middleware", () => {
  it("should parse body and params, enrich the request, and call next", () => {
    const req = mockRequest({ body: validBody, params: validParams });
    const res = mockResponse();
    const next: NextFunction = vi.fn();

    validate(schema)(req, res, next);

    expect(req.body).toEqual(validBody);
    expect(req.params).toEqual(validParams);
    expect(next).toHaveBeenCalled();
  });

  it("should throw ZodError when body is missing required fields", () => {
    const req = mockRequest({ body: {}, params: validParams });
    const res = mockResponse();
    const next: NextFunction = vi.fn();

    expect(() => validate(schema)(req, res, next)).toThrow(z.ZodError);
    expect(next).not.toHaveBeenCalled();
  });

  it("should throw ZodError when params are invalid", () => {
    const req = mockRequest({ body: validBody, params: { id: "" } });
    const res = mockResponse();
    const next: NextFunction = vi.fn();

    expect(() => validate(schema)(req, res, next)).toThrow(z.ZodError);
    expect(next).not.toHaveBeenCalled();
  });

  it("should not overwrite body when schema contains only params", () => {
    const paramsOnlySchema = z.object({
      params: z.object({ id: z.string().nonempty() }),
    });
    const req = mockRequest({
      body: { keep: "this" },
      params: validParams,
    });
    const res = mockResponse();
    const next: NextFunction = vi.fn();

    validate(paramsOnlySchema)(req, res, next);

    expect(req.body).toEqual({ keep: "this" });
    expect(next).toHaveBeenCalled();
  });

  it("should not overwrite params when schema contains only body", () => {
    const bodyOnlySchema = z.object({
      body: z.object({ name: z.string().nonempty() }),
    });
    const req = mockRequest({
      body: { name: "Living Room" },
      params: { id: "original-id" },
    });
    const res = mockResponse();
    const next: NextFunction = vi.fn();

    validate(bodyOnlySchema)(req, res, next);

    expect(req.params.id).toBe("original-id");
    expect(next).toHaveBeenCalled();
  });
});
