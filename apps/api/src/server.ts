import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { health } from './health.ts';

type Product = { id: string; organizationId: string; sku?: string; barcode?: string; name: string; unit: string; active: boolean; createdAt: string; updatedAt: string };
type Sale = { id: string; organizationId: string; productId: string; quantity: number; unitPrice: number; total: number; createdAt: string };

const products = new Map<string, Product>();
const sales = new Map<string, Sale>();
const seenIdempotency = new Map<string, unknown>();

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}
async function body(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
}
function org(req: IncomingMessage) { return req.headers['x-organization-id']?.toString() || ''; }
function auth(req: IncomingMessage) { return Boolean(req.headers.authorization?.startsWith('Bearer ')); }
function fail(res: ServerResponse, status: number, code: string, message: string) { json(res, status, { error: { code, message } }); }

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, health());
    if (req.method === 'GET' && url.pathname === '/') return json(res, 200, { service: 'azaz-business-api', version: '0.2.0', status: 'ok', endpoints: ['GET /health', 'GET /api/v1/products', 'POST /api/v1/products', 'GET /api/v1/sales', 'POST /api/v1/sales'] });
    if (url.pathname.startsWith('/api/v1/') && !auth(req)) return fail(res, 401, 'UNAUTHENTICATED', 'Authentication required');
    const organizationId = org(req);
    if (url.pathname.startsWith('/api/v1/') && !organizationId) return fail(res, 400, 'TENANT_REQUIRED', 'X-Organization-Id is required');

    if (req.method === 'GET' && url.pathname === '/api/v1/products') {
      return json(res, 200, [...products.values()].filter(p => p.organizationId === organizationId));
    }
    if (req.method === 'POST' && url.pathname === '/api/v1/products') {
      const input = await body(req);
      if (typeof input.name !== 'string' || !input.name.trim()) return fail(res, 422, 'VALIDATION_ERROR', 'name is required');
      const id = randomUUID(); const now = new Date().toISOString();
      const p: Product = { id, organizationId, name: input.name.trim(), unit: typeof input.unit === 'string' ? input.unit : 'piece', active: true, createdAt: now, updatedAt: now };
      if (typeof input.sku === 'string') p.sku = input.sku;
      if (typeof input.barcode === 'string') p.barcode = input.barcode;
      products.set(id, p); return json(res, 201, p);
    }
    if (req.method === 'POST' && url.pathname === '/api/v1/sales') {
      const key = req.headers['idempotency-key']?.toString();
      if (!key) return fail(res, 400, 'IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key is required');
      const previous = seenIdempotency.get(`${organizationId}:${key}`); if (previous) return json(res, 200, previous);
      const input = await body(req); const product = products.get(String(input.productId));
      if (!product || product.organizationId !== organizationId) return fail(res, 404, 'PRODUCT_NOT_FOUND', 'Product not found');
      const quantity = Number(input.quantity), unitPrice = Number(input.unitPrice);
      if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) return fail(res, 422, 'VALIDATION_ERROR', 'Invalid quantity or unitPrice');
      const sale: Sale = { id: randomUUID(), organizationId, productId: product.id, quantity, unitPrice, total: quantity * unitPrice, createdAt: new Date().toISOString() };
      sales.set(sale.id, sale); seenIdempotency.set(`${organizationId}:${key}`, sale); return json(res, 201, sale);
    }
    if (req.method === 'GET' && url.pathname === '/api/v1/sales') return json(res, 200, [...sales.values()].filter(s => s.organizationId === organizationId));
    return fail(res, 404, 'NOT_FOUND', 'Route not found');
  } catch (error) { return fail(res, 400, 'BAD_REQUEST', error instanceof Error ? error.message : 'Invalid request'); }
});

const port = Number(process.env.PORT || 8080);
server.listen(port, '0.0.0.0', () => console.log(`AZAZ BUSINESS API listening on :${port}`));
