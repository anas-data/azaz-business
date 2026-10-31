export type SyncOperation = {
  operationId: string;
  deviceId: string;
  organizationId: string;
  entity: 'sale' | 'payment' | 'product' | 'customer' | 'stock_adjustment';
  operation: 'create' | 'update' | 'void';
  payload: unknown;
  clientCreatedAt: string;
  idempotencyKey: string;
  baseCursor?: string;
};

export type SyncAck = {
  operationId: string;
  status: 'applied' | 'already_applied' | 'rejected';
  cursor?: string;
  reason?: string;
};
