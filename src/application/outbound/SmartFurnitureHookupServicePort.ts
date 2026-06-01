export interface SmartFurnitureHookupServicePort {
  smartFurnitureHookupExists(id: string): Promise<boolean | Error>;
}
