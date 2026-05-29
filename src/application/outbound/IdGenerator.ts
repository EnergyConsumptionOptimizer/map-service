export type GeneratedId = string;

export interface IdGenerator {
  generate(): GeneratedId;
}
