import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
const p=spawn(process.execPath,['apps/api/src/server.mjs'],{stdio:'ignore',env:{...process.env,PORT:'8099'}});await new Promise(r=>setTimeout(r,250));
const h={authorization:'Bearer test','x-organization-id':'org-a','content-type':'application/json'};
let r=await fetch('http://127.0.0.1:8099/health');assert.equal(r.status,200);
r=await fetch('http://127.0.0.1:8099/api/v1/products',{method:'POST',headers:h,body:JSON.stringify({name:'Test Product',sku:'T-1'})});assert.equal(r.status,201);const product=await r.json();
r=await fetch('http://127.0.0.1:8099/api/v1/sales',{method:'POST',headers:{...h,'idempotency-key':'k1'},body:JSON.stringify({productId:product.id,quantity:2,unitPrice:5})});assert.equal(r.status,201);const a=await r.json();
r=await fetch('http://127.0.0.1:8099/api/v1/sales',{method:'POST',headers:{...h,'idempotency-key':'k1'},body:JSON.stringify({productId:product.id,quantity:999,unitPrice:999})});assert.equal(r.status,200);const b=await r.json();assert.equal(a.id,b.id);
r=await fetch('http://127.0.0.1:8099/api/v1/products',{headers:{authorization:'Bearer test','x-organization-id':'org-b'}});assert.equal((await r.json()).length,0);p.kill();console.log('integration: OK');
