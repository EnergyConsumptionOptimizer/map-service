import { IdEmptyError } from "@domain/errors";

export class ZoneID {
  private constructor(public readonly value: string) {}

  static from(id: string): ZoneID | IdEmptyError {
    const trimmed = id.trim();

    if (!trimmed) {
      return new IdEmptyError();
    }

    return new ZoneID(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: ZoneID): boolean {
    return this.value === other.value;
  }
}
