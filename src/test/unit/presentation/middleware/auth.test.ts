import type { NextFunction, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthRequiredError, ForbiddenError } from "@presentation/errors";
import {
  type AppLocals,
  AuthMiddleware,
} from "@presentation/rest/middlewares/AuthMiddleware";
import { mockRequest } from "@test/unit/presentation/mockRequest";

function mockAuthResponse(): Response<unknown, AppLocals> {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    locals: {} as AppLocals,
    headersSent: false,
  } as unknown as Response<unknown, AppLocals>;
}

describe("AuthMiddleware", () => {
  let authMiddleware: AuthMiddleware;

  beforeEach(() => {
    authMiddleware = new AuthMiddleware();
  });

  describe("forwardAuth()", () => {
    it("should populate res.locals.user from headers and call next", () => {
      const req = mockRequest({
        headers: {
          "x-user-id": "user-1",
          "x-user-role": "ADMIN",
          "x-user-username": "alice",
        },
      });
      const res = mockAuthResponse();
      const next: NextFunction = vi.fn();

      authMiddleware.forwardAuth(req, res, next);

      expect(res.locals.user).toEqual({
        id: "user-1",
        username: "alice",
        role: "ADMIN",
      });
      expect(next).toHaveBeenCalled();
    });

    it("should default to HOUSEHOLD role when x-user-role header is absent", () => {
      const req = mockRequest({
        headers: { "x-user-id": "user-2", "x-user-username": "bob" },
      });
      const res = mockAuthResponse();
      const next: NextFunction = vi.fn();

      authMiddleware.forwardAuth(req, res, next);

      expect(res.locals.user).toMatchObject({ role: "HOUSEHOLD" });
      expect(next).toHaveBeenCalled();
    });

    it("should default username to empty string when x-user-username header is absent", () => {
      const req = mockRequest({
        headers: { "x-user-id": "user-3" },
      });
      const res = mockAuthResponse();
      const next: NextFunction = vi.fn();

      authMiddleware.forwardAuth(req, res, next);

      expect(res.locals.user).toMatchObject({ username: "" });
      expect(next).toHaveBeenCalled();
    });

    it("should throw AuthRequiredError when x-user-id header is absent", () => {
      const req = mockRequest({ headers: {} });
      const res = mockAuthResponse();
      const next: NextFunction = vi.fn();

      expect(() => authMiddleware.forwardAuth(req, res, next)).toThrow(
        AuthRequiredError,
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("requireRole()", () => {
    it("should call next when the user has the required role", () => {
      const middleware = authMiddleware.requireRole("ADMIN");
      const req = mockRequest();
      const res = mockAuthResponse();
      res.locals.user = { id: "u1", username: "alice", role: "ADMIN" };
      const next: NextFunction = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should throw ForbiddenError when the user has an insufficient role", () => {
      const middleware = authMiddleware.requireRole("ADMIN");
      const req = mockRequest();
      const res = mockAuthResponse();
      res.locals.user = { id: "u2", username: "bob", role: "HOUSEHOLD" };
      const next: NextFunction = vi.fn();

      expect(() => middleware(req, res, next)).toThrow(ForbiddenError);
      expect(next).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenError when no user is set in locals", () => {
      const middleware = authMiddleware.requireRole("ADMIN");
      const req = mockRequest();
      const res = mockAuthResponse();
      const next: NextFunction = vi.fn();

      expect(() => middleware(req, res, next)).toThrow(ForbiddenError);
      expect(next).not.toHaveBeenCalled();
    });

    it("should accept any of the listed roles", () => {
      const middleware = authMiddleware.requireRole("ADMIN", "HOUSEHOLD");
      const req = mockRequest();
      const res = mockAuthResponse();
      res.locals.user = { id: "u3", username: "carol", role: "HOUSEHOLD" };
      const next: NextFunction = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
