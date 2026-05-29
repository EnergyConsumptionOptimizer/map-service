import { IdEmptyError } from "@domain/errors";

export class SmartFurnitureHookupID {
  private constructor(public readonly value: string) {}

  static from(id: string): SmartFurnitureHookupID | IdEmptyError {
    const trimmed = id.trim();

    if (!trimmed) {
      return new IdEmptyError();
    }

    return new SmartFurnitureHookupID(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: SmartFurnitureHookupID): boolean {
    return this.value === other.value;
  }
}
