import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
const products=new Map(), sales=new Map(), idempotency=new Map();
const send=(res,status,data)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
const read=async req=>{let s='';for await(const c of req)s+=c;return s?JSON.parse(s):{};};
const server=createServer(async(req,res)=>{try{const u=new URL(req.url||'/', 'http://localhost');
if(req.method==='GET'&&u.pathname==='/health')return send(res,200,{status:'ok',service:'azaz-business-api',version:'0.2.0',time:new Date().toISOString()});
if(req.method==='GET'&&u.pathname==='/')return send(res,200,{service:'azaz-business-api',version:'0.2.0',status:'ok',endpoints:['GET /health','GET /api/v1/products','POST /api/v1/products','GET /api/v1/sales','POST /api/v1/sales']});
if(!u.pathname.startsWith('/api/v1/'))return send(res,404,{error:{code:'NOT_FOUND',message:'Route not found'}});
if(!req.headers.authorization?.startsWith('Bearer '))return send(res,401,{error:{code:'UNAUTHENTICATED',message:'Authentication required'}});
const org=req.headers['x-organization-id'];if(!org)return send(res,400,{error:{code:'TENANT_REQUIRED',message:'X-Organization-Id is required'}});
if(req.method==='GET'&&u.pathname==='/api/v1/products')return send(res,200,[...products.values()].filter(x=>x.organizationId===org));
if(req.method==='POST'&&u.pathname==='/api/v1/products'){const b=await read(req);if(typeof b.name!=='string'||!b.name.trim())return send(res,422,{error:{code:'VALIDATION_ERROR',message:'name is required'}});const p={id:randomUUID(),organizationId:org,name:b.name.trim(),unit:typeof b.unit==='string'?b.unit:'piece',active:true,createdAt:new Date().toISOString()};if(typeof b.sku==='string')p.sku=b.sku;if(typeof b.barcode==='string')p.barcode=b.barcode;products.set(p.id,p);return send(res,201,p);}
if(req.method==='POST'&&u.pathname==='/api/v1/sales'){const key=req.headers['idempotency-key'];if(!key)return send(res,400,{error:{code:'IDEMPOTENCY_KEY_REQUIRED',message:'Idempotency-Key is required'}});const ik=`${org}:${key}`;if(idempotency.has(ik))return send(res,200,idempotency.get(ik));const b=await read(req),p=products.get(String(b.productId));if(!p||p.organizationId!==org)return send(res,404,{error:{code:'PRODUCT_NOT_FOUND',message:'Product not found'}});const q=Number(b.quantity),price=Number(b.unitPrice);if(!Number.isFinite(q)||q<=0||!Number.isFinite(price)||price<0)return send(res,422,{error:{code:'VALIDATION_ERROR',message:'Invalid quantity or unitPrice'}});const sale={id:randomUUID(),organizationId:org,productId:p.id,quantity:q,unitPrice:price,total:q*price,createdAt:new Date().toISOString()};sales.set(sale.id,sale);idempotency.set(ik,sale);return send(res,201,sale);}
if(req.method==='GET'&&u.pathname==='/api/v1/sales')return send(res,200,[...sales.values()].filter(x=>x.organizationId===org));return send(res,404,{error:{code:'NOT_FOUND',message:'Route not found'}});
}catch(e){return send(res,400,{error:{code:'BAD_REQUEST',message:e instanceof Error?e.message:'Invalid request'}})}});
const port=Number(process.env.PORT||8080); server.listen(port,'0.0.0.0',()=>console.log(`AZAZ BUSINESS API listening on :${port}`));
