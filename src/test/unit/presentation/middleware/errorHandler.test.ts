import type { NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import type { Logger } from "pino";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { AuthRequiredError, ForbiddenError } from "@presentation/errors";
import {
  DomainErrorCode,
  FloorPlanNotFoundError,
  ZoneNotFoundError,
  SmartFurnitureHookupNotFoundError,
  IdEmptyError,
  ZoneNameEmptyError,
  FloorPlanEmptyError,
  ZoneNameAlreadyExistsError,
  SmartFurnitureHookupAlreadyExistsError,
  InvalidColorError,
  InvalidCoordinateError,
  InvalidPolygonError,
  InvalidFloorPlanError,
} from "@domain/errors";
import { createErrorHandler } from "@presentation/rest/middlewares/errorHandlerMiddleware";
import { mockRequest } from "@test/unit/presentation/mockRequest";
import { mockResponse } from "@test/unit/presentation/mockResponse";

function mockLogger(): Logger {
  return {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
  } as unknown as Logger;
}

describe("createErrorHandler() middleware", () => {
  const logger = mockLogger();
  const errorHandler = createErrorHandler(logger);
  const next: NextFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should forward to next when headers have already been sent", () => {
    const req = mockRequest();
    const res = mockResponse();
    res.headersSent = true;

    errorHandler(new Error("late"), req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 400 VALIDATION_ERROR with field-level details for ZodErrors", () => {
    const zodError = new ZodError([
      { code: "custom", message: "Name is required", path: ["body", "name"] },
      { code: "custom", message: "Color is required", path: ["body", "color"] },
    ]);
    const req = mockRequest();
    const res = mockResponse();

    errorHandler(zodError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      code: "VALIDATION_ERROR",
      message: "Invalid request payload",
      errors: {
        "body.name": "Name is required",
        "body.color": "Color is required",
      },
    });
  });

  describe("presentation errors", () => {
    it.each([
      {
        error: new AuthRequiredError(),
        expectedStatus: StatusCodes.UNAUTHORIZED,
        expectedCode: "UNAUTHORIZED",
      },
      {
        error: new ForbiddenError(),
        expectedStatus: StatusCodes.FORBIDDEN,
        expectedCode: "FORBIDDEN",
      },
    ])(
      "should map $error.constructor.name → $expectedStatus ($expectedCode)",
      ({ error, expectedStatus, expectedCode }) => {
        const req = mockRequest();
        const res = mockResponse();

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(expectedStatus);
        expect(res.json).toHaveBeenCalledWith({
          code: expectedCode,
          message: error.message,
        });
        expect(logger.warn).toHaveBeenCalled();
      },
    );
  });

  describe("domain errors", () => {
    it.each([
      // NOT_FOUND
      {
        error: new FloorPlanNotFoundError(),
        expectedStatus: StatusCodes.NOT_FOUND,
        expectedCode: DomainErrorCode.NOT_FOUND,
      },
      {
        error: new ZoneNotFoundError("zone-1"),
        expectedStatus: StatusCodes.NOT_FOUND,
        expectedCode: DomainErrorCode.NOT_FOUND,
      },
      {
        error: new SmartFurnitureHookupNotFoundError("sfh-1"),
        expectedStatus: StatusCodes.NOT_FOUND,
        expectedCode: DomainErrorCode.NOT_FOUND,
      },
      // EMPTY_FIELD
      {
        error: new IdEmptyError(),
        expectedStatus: StatusCodes.BAD_REQUEST,
        expectedCode: DomainErrorCode.EMPTY_FIELD,
      },
      {
        error: new ZoneNameEmptyError(),
        expectedStatus: StatusCodes.BAD_REQUEST,
        expectedCode: DomainErrorCode.EMPTY_FIELD,
      },
      {
        error: new FloorPlanEmptyError(),
        expectedStatus: StatusCodes.BAD_REQUEST,
        expectedCode: DomainErrorCode.EMPTY_FIELD,
      },
      // UNIQUE_FIELD_ALREADY_EXISTS
      {
        error: new ZoneNameAlreadyExistsError("Living Room"),
        expectedStatus: StatusCodes.CONFLICT,
        expectedCode: DomainErrorCode.UNIQUE_FIELD_ALREADY_EXISTS,
      },
      {
        error: new SmartFurnitureHookupAlreadyExistsError("sfh-1"),
        expectedStatus: StatusCodes.CONFLICT,
        expectedCode: DomainErrorCode.UNIQUE_FIELD_ALREADY_EXISTS,
      },
      // Map-specific format errors
      {
        error: new InvalidColorError("#xyz"),
        expectedStatus: StatusCodes.BAD_REQUEST,
        expectedCode: DomainErrorCode.INVALID_COLOR,
      },
      {
        error: new InvalidCoordinateError(),
        expectedStatus: StatusCodes.BAD_REQUEST,
        expectedCode: DomainErrorCode.INVALID_COORDINATE,
      },
      {
        error: new InvalidPolygonError(),
        expectedStatus: StatusCodes.BAD_REQUEST,
        expectedCode: DomainErrorCode.INVALID_POLYGON,
      },
      {
        error: new InvalidFloorPlanError(),
        expectedStatus: StatusCodes.UNPROCESSABLE_ENTITY,
        expectedCode: DomainErrorCode.INVALID_FLOOR_PLAN,
      },
    ])(
      "should map $error.constructor.name → $expectedStatus ($expectedCode)",
      ({ error, expectedStatus, expectedCode }) => {
        const req = mockRequest();
        const res = mockResponse();

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(expectedStatus);
        expect(res.json).toHaveBeenCalledWith({
          code: expectedCode,
          message: error.message,
        });
        expect(logger.warn).toHaveBeenCalled();
      },
    );
  });

  it("should return 500 INTERNAL_SERVER_ERROR for unknown errors", () => {
    const req = mockRequest();
    const res = mockResponse();

    errorHandler(new Error("Something exploded"), req, res, next);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    });
    expect(logger.error).toHaveBeenCalled();
  });
});
