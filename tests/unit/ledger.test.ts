import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStock } from '../../packages/domain/src/ledger.ts';

test('stock is derived from ledger entries', () => {
  assert.equal(calculateStock([
    { organizationId: 'o', productId: 'p', quantity: 10, movementType: 'opening', referenceId: 'r1', createdAt: new Date().toISOString() },
    { organizationId: 'o', productId: 'p', quantity: 5, movementType: 'purchase', referenceId: 'r2', createdAt: new Date().toISOString() },
    { organizationId: 'o', productId: 'p', quantity: -3, movementType: 'sale', referenceId: 'r3', createdAt: new Date().toISOString() }
  ]), 12);
});
