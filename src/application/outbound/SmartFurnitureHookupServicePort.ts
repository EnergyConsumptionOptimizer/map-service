import { SmartFurnitureHookup } from "@domain/entities/SmartFurnitureHookup";

export interface SmartFurnitureHookupServicePort {
  getSmartFurnitureHookup(id: string): Promise<SmartFurnitureHookup | Error>;
}
