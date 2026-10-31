export type LedgerEntry = {
  organizationId: string;
  productId: string;
  quantity: number;
  movementType: 'opening' | 'purchase' | 'sale' | 'purchase_return' | 'sale_return' | 'damage' | 'transfer' | 'adjustment';
  referenceId: string;
  createdAt: string;
};

export function calculateStock(entries: readonly LedgerEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.quantity, 0);
}
