import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { Logger } from "pino";
import { ZodError } from "zod";
import { DomainError, DomainErrorCode } from "@domain/errors";
import { AuthRequiredError, ForbiddenError } from "@presentation/errors";
import { mapErrorsTotal } from "@infrastructure/metrics/errorMetrics";

interface ErrorHandlerEntry {
  status: number;
  code: string;
}

const PRESENTATION_ERROR_MAP = new Map<
  new (...args: never[]) => Error,
  ErrorHandlerEntry
>();

PRESENTATION_ERROR_MAP.set(AuthRequiredError, {
  status: StatusCodes.UNAUTHORIZED,
  code: "UNAUTHORIZED",
});
PRESENTATION_ERROR_MAP.set(ForbiddenError, {
  status: StatusCodes.FORBIDDEN,
  code: "FORBIDDEN",
});

const DOMAIN_CODE_TO_STATUS_MAP: Record<string, number> = {
  [DomainErrorCode.EMPTY_FIELD]: StatusCodes.BAD_REQUEST,
  [DomainErrorCode.NOT_FOUND]: StatusCodes.NOT_FOUND,
  [DomainErrorCode.UNIQUE_FIELD_ALREADY_EXISTS]: StatusCodes.CONFLICT,
  [DomainErrorCode.INVALID_COLOR]: StatusCodes.BAD_REQUEST,
  [DomainErrorCode.INVALID_COORDINATE]: StatusCodes.BAD_REQUEST,
  [DomainErrorCode.INVALID_POLYGON]: StatusCodes.BAD_REQUEST,
  [DomainErrorCode.INVALID_FLOOR_PLAN]: StatusCodes.UNPROCESSABLE_ENTITY,
};

export function createErrorHandler(logger: Logger) {
  return (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    if (res.headersSent) {
      next(error);
      return;
    }

    mapErrorsTotal.add(1, { type: error.constructor.name });

    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      res.status(StatusCodes.BAD_REQUEST).json({
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        errors: fieldErrors,
      });
      return;
    }

    if (error instanceof DomainError) {
      logger.warn(
        {
          err: error,
          path: req.path,
          method: req.method,
          domainCode: error.code,
        },
        error.message,
      );

      const status =
        DOMAIN_CODE_TO_STATUS_MAP[error.code] ?? StatusCodes.BAD_REQUEST;

      res.status(status).json({
        code: error.code,
        message: error.message,
      });
      return;
    }

    const presentationEntry = PRESENTATION_ERROR_MAP.get(
      error.constructor as new (...args: never[]) => Error,
    );
    if (presentationEntry) {
      logger.warn(
        { err: error, path: req.path, method: req.method },
        error.message,
      );
      res.status(presentationEntry.status).json({
        code: presentationEntry.code,
        message: error.message,
      });
      return;
    }

    logger.error(
      { err: error, path: req.path, method: req.method },
      "Unhandled internal error",
    );
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    });
  };
}
