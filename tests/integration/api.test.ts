import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';

let proc: ChildProcess;
let base = '';

async function freePort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      probe.close(() => resolve(port));
    });
  });
}

async function waitForHealth(url: string, timeoutMs = 15_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) return;
      lastError = new Error(`health responded ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (proc.exitCode !== null) throw new Error(`API exited with code ${proc.exitCode}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`API did not become healthy at ${url}`, { cause: lastError });
}

test.before(async () => {
  const port = await freePort();
  base = `http://127.0.0.1:${port}`;
  proc = spawn(process.execPath, ['--experimental-strip-types', 'apps/api/src/server.ts'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: String(port) },
  });
  await waitForHealth(base);
});

test.after(() => { proc.kill(); });

const authHeaders = { authorization: 'Bearer test', 'x-organization-id': 'org-a', 'content-type': 'application/json' };

test('health endpoint works', async () => {
  const response = await fetch(`${base}/health`);
  assert.equal(response.status, 200);
  const body = await response.json() as { status: string; service: string };
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'azaz-business-api');
});

test('protected endpoints reject anonymous callers', async () => {
  const response = await fetch(`${base}/api/v1/products`);
  assert.equal(response.status, 401);
  const body = await response.json() as { error: { code: string } };
  assert.equal(body.error.code, 'UNAUTHENTICATED');
});

test('tenant header is required', async () => {
  const response = await fetch(`${base}/api/v1/products`, { headers: { authorization: 'Bearer test' } });
  assert.equal(response.status, 400);
  const body = await response.json() as { error: { code: string } };
  assert.equal(body.error.code, 'TENANT_REQUIRED');
});

test('tenant-scoped product creation and idempotent sale', async () => {
  const created = await fetch(`${base}/api/v1/products`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ name: 'Test Product', sku: 'T-1' }) });
  assert.equal(created.status, 201);
  const product = await created.json() as { id: string; name: string; sku?: string };

  const first = await fetch(`${base}/api/v1/sales`, { method: 'POST', headers: { ...authHeaders, 'idempotency-key': 'k1' }, body: JSON.stringify({ productId: product.id, quantity: 2, unitPrice: 5 }) });
  const second = await fetch(`${base}/api/v1/sales`, { method: 'POST', headers: { ...authHeaders, 'idempotency-key': 'k1' }, body: JSON.stringify({ productId: product.id, quantity: 999, unitPrice: 999 }) });
  assert.equal(first.status, 201);
  assert.equal(second.status, 200);

  const sale = await first.json() as { id: string; total: number };
  assert.equal(sale.total, 10);
  assert.deepEqual((await second.json()).id, sale.id);

  const otherTenant = await fetch(`${base}/api/v1/products`, { headers: { authorization: 'Bearer test', 'x-organization-id': 'org-b' } });
  assert.equal(otherTenant.status, 200);
  assert.equal(((await otherTenant.json()) as unknown[]).length, 0);
});

test('invalid sale and unknown product are rejected', async () => {
  const created = await fetch(`${base}/api/v1/products`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ name: 'Second Product' }) });
  assert.equal(created.status, 201);
  const product = await created.json() as { id: string };

  const invalid = await fetch(`${base}/api/v1/sales`, { method: 'POST', headers: { ...authHeaders, 'idempotency-key': 'k-invalid' }, body: JSON.stringify({ productId: product.id, quantity: -1, unitPrice: 5 }) });
  assert.equal(invalid.status, 422);

  const missingKey = await fetch(`${base}/api/v1/sales`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ productId: product.id, quantity: 1, unitPrice: 5 }) });
  assert.equal(missingKey.status, 400);

  const unknownProduct = await fetch(`${base}/api/v1/sales`, { method: 'POST', headers: { ...authHeaders, 'idempotency-key': 'k-unknown' }, body: JSON.stringify({ productId: 'does-not-exist', quantity: 1, unitPrice: 5 }) });
  assert.equal(unknownProduct.status, 404);

  const missingName = await fetch(`${base}/api/v1/products`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ sku: 'X' }) });
  assert.equal(missingName.status, 422);
});

test('unknown route returns 404', async () => {
  const response = await fetch(`${base}/api/v1/unknown`, { headers: authHeaders });
  assert.equal(response.status, 404);
});
