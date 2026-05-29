import { InvalidColorError } from "@domain/errors";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export class Color {
  private constructor(public readonly value: string) {}

  static from(value: string): Color | InvalidColorError {
    if (!HEX_COLOR.test(value)) {
      return new InvalidColorError(value);
    }
    return new Color(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Color): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }
}
