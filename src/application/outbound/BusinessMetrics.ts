export interface BusinessMetrics {
  // Floor plan
  recordFloorPlanCreation(): void;

  // Zone
  recordZoneCreation(): void;
  recordZoneUpdate(): void;
  recordZoneDeletion(): void;

  // Smart furniture hookup
  recordSmartFurnitureHookupCreation(): void;
  recordSmartFurnitureHookupUpdate(): void;
  recordSmartFurnitureHookupDeletion(): void;
}
