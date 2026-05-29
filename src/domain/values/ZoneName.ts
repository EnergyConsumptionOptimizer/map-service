import { ZoneNameEmptyError } from "@domain/errors";

export class ZoneName {
  private constructor(public readonly value: string) {}

  static from(name: string): ZoneName | ZoneNameEmptyError {
    const trimmed = name.trim();
    if (!trimmed) {
      return new ZoneNameEmptyError();
    }
    return new ZoneName(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: ZoneName): boolean {
    return this.value === other.value;
  }
}
