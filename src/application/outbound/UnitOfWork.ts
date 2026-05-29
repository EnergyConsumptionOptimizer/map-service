export interface UnitOfWork {
  executeTransactionally<T>(operation: () => Promise<T>): Promise<T>;
}
