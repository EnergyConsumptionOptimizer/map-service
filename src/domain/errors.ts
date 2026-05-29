export const DomainErrorCode = {
  EMPTY_FIELD: "EMPTY_FIELD",
  UNIQUE_FIELD_ALREADY_EXISTS: "UNIQUE_FIELD_ALREADY_EXISTS",
  NOT_FOUND: "NOT_FOUND",
  INVALID_COLOR: "INVALID_COLOR",
  INVALID_COORDINATE: "INVALID_COORDINATE",
  INVALID_POLYGON: "INVALID_POLYGON",
  INVALID_FLOOR_PLAN: "INVALID_FLOOR_PLAN",
} as const;

export abstract class DomainError extends Error {
  public abstract readonly code: string;

  protected constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export function stripErrors<T extends Record<string, unknown>>(
  obj: T,
): { [K in keyof T]: Exclude<T[K], Error> } | Error {
  const error = Object.values(obj).find((v): v is Error => v instanceof Error);
  return error ?? (obj as { [K in keyof T]: Exclude<T[K], Error> });
}

// ==========================================
// Empty Field Errors
// ==========================================

export abstract class EmptyFieldError extends DomainError {
  public readonly code = DomainErrorCode.EMPTY_FIELD;

  protected constructor(fieldName: string) {
    super(`${fieldName} must not be empty`);
  }
}

export class IdEmptyError extends EmptyFieldError {
  constructor() {
    super("ID");
  }
}

export class ZoneNameEmptyError extends EmptyFieldError {
  constructor() {
    super("Zone name");
  }
}

export class FloorPlanEmptyError extends EmptyFieldError {
  constructor() {
    super("SVG content");
  }
}

// ==========================================
// Unique Field Conflict Errors
// ==========================================

export abstract class UniqueFieldAlreadyExistsError extends DomainError {
  public readonly code = DomainErrorCode.UNIQUE_FIELD_ALREADY_EXISTS;

  protected constructor(fieldName: string, fieldValue: string) {
    super(`${fieldName} ${fieldValue} already exists`);
  }
}

export class ZoneNameAlreadyExistsError extends UniqueFieldAlreadyExistsError {
  constructor(name: string) {
    super("Zone with name", name);
  }
}

export class SmartFurnitureHookupAlreadyExistsError extends UniqueFieldAlreadyExistsError {
  constructor(id: string) {
    super("Smart furniture hookup with ID", id);
  }
}

// ==========================================
// Resource Not Found Errors
// ==========================================

export class NotFoundError extends DomainError {
  public readonly code = DomainErrorCode.NOT_FOUND;

  constructor(entityName = "Resource") {
    super(`${entityName} not found`);
  }
}

export class FloorPlanNotFoundError extends NotFoundError {
  constructor() {
    super("Floor plan");
  }
}

export class ZoneNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Zone ID ${id}`);
  }
}

export class SmartFurnitureHookupNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Smart furniture hookup ID ${id}`);
  }
}

// ==========================================
// Invariant / Format Errors
// ==========================================

export class InvalidColorError extends DomainError {
  public readonly code = DomainErrorCode.INVALID_COLOR;

  constructor(value: string) {
    super(`Color must be in hex format #RRGGBB, got: ${value}`);
  }
}

export class InvalidCoordinateError extends DomainError {
  public readonly code = DomainErrorCode.INVALID_COORDINATE;

  constructor() {
    super("Point coordinates must be finite numbers");
  }
}

export class InvalidPolygonError extends DomainError {
  public readonly code = DomainErrorCode.INVALID_POLYGON;

  constructor() {
    super("A polygon must have at least 3 vertices");
  }
}

export class InvalidFloorPlanError extends DomainError {
  public readonly code = DomainErrorCode.INVALID_FLOOR_PLAN;

  constructor() {
    super("The provided SVG is not valid");
  }
}
