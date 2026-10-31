# تقرير تنفيذ الاختبارات — AZAZ BUSINESS 0.2.0

- التاريخ: 2026-10-31
- البيئة: Node.js v22.22.3، npm 10.9.8، Linux (x64)
- الفرع: `arena/c4d2c199-azaz-business`

## 1. الملخص التنفيذي

| البوابة | قبل الإصلاح | بعد الإصلاح |
| --- | --- | --- |
| `npm test` (اختبارات الوحدة + التكامل) | ❌ 1 ناجح / 2 فاشل | ✅ 7 ناجح / 0 فاشل |
| `npm run test:smoke` (اختبار الدخان `.mjs`) | ✅ ناجح | ✅ ناجح |
| `npm run typecheck` | ❌ فاشل (الحزم والأنواع غير مثبّتة) | ✅ نظيف |
| `npm run build` | ❌ فاشل | ✅ يبني `dist/apps/api/src/server.js` |
| تشغيل البناء `node dist/...` + `/health` | — | ✅ `{"status":"ok"}` |
| `npm run security` (npm audit) | — | ✅ 0 ثغرات |
| `make verify` | ❌ فاشل | ✅ `AZAZ BUSINESS verification gate passed` |
| فحوص سياسة المستودع في CI | ✅ | ✅ |

**النتيجة:** المشروع كان معطّلاً عند نقطة الدخول الخاصة باختبارات التكامل (الخادم لا يُقلع أساساً)، وتم إصلاح السبب الجذري، وتقوية الاختبار، وإضافة تغطية لمسارات المصادقة والتحقق. المشروع الآن يمرّ من جميع بوابات الجودة المتاحة محلياً.

## 2. العطل الجذري (Root Cause)

اختبار التكامل `tests/integration/api.test.ts` يشغّل الخادم مباشرة من المصدر:

```
node --experimental-strip-types apps/api/src/server.ts
```

بينما كان `apps/api/src/server.ts` يستورد:

```ts
import { health } from './health.js';
```

Node عند تجريد أنواع TypeScript **لا يعيد كتابة** المُعرّفات (specifiers)، لذلك يفشل التشغيل بـ:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../apps/api/src/health.js'
```

فيموت الخادم قبل الاستماع على المنفذ، ويفشل كل اختبار تكامل بـ `fetch failed`.

### الإصلاح
- `apps/api/src/server.ts`: الاستيراد أصبح `./health.ts`.
- `tsconfig.json`: إضافة `allowImportingTsExtensions` و`rewriteRelativeImportExtensions` حتى يبقى `tsc` قادراً على البناء وتحويل `.ts` إلى `.js` في `dist` (تم التحقق: البناء نظيف والتشغيل من `dist` يعمل).

## 3. إصلاحات في بنية الاختبار

| المشكلة | الأثر | الإصلاح |
| --- | --- | --- |
| منفذ ثابت `8080` | تعارض مع أي خدمة أخرى + فشل غير حتمي | اختيار منفذ حر ديناميكياً عبر `node:net` وتمريره بـ `PORT` |
| `setTimeout(350)` قبل الاختبار | اختبار هشّ (flaky) حسب سرعة الجهاز | انتظار جاهزية حقيقية عبر استقصاء `/health` مع مهلة 15 ثانية وكشف خروج العملية |
| تعريف المتغيرات العالمية داخل الاختبار | لا تحقق من جاهزية الخادم | `test.before` يضمن الجاهزية، و`test.after` يقتل العملية |
| `tests/integration/api.mjs` غير مُكتشف بواسطة `npm test` | اختبار دخان لا يعمل تلقائياً | سكربت جديد `npm run test:smoke` و`npm run test:all` |

## 4. تغطية جديدة

أُضيفت الحالات التالية إلى `tests/integration/api.test.ts`:

1. `GET /health` → 200 مع شكل الاستجابة الصحيح (`status` و`service`).
2. طلب بدون `Authorization` → 401 `UNAUTHENTICATED`.
3. طلب بدون `X-Organization-Id` → 400 `TENANT_REQUIRED`.
4. إنشاء منتج + بيع + **تكرار نفس `Idempotency-Key`** → 201 ثم 200 بنفس المعرّف، والمجموع = 10.
5. عزل المستأجرين: مستأجر آخر يرى 0 منتجات.
6. تحقق مدخلات البيع: كمية سالبة → 422، غياب مفتاح التكرار → 400، منتج غير موجود → 404.
7. إنشاء منتج بدون اسم → 422.
8. مسار غير معروف → 404.

### فحص إضافي (خارج مجموعة الاختبارات)
- **إدخال تالف (JSON غير صالح)** → 400 `BAD_REQUEST`، رسالة خطأ لا تكشف stack.
- **جسم فارغ / اسم مسافات بيضاء** → 422 `VALIDATION_ERROR`.
- **حمل تزامني:** 100 طلب متوازٍ بنفس `Idempotency-Key` → 1 × 201 و99 × 200، وسجل بيع واحد فقط (بلا تكرار). ✅

## 5. الملاحظات والمخاطر المتبقية (لم تُعدّل)

| # | الملاحظة | الخطورة | التوصية |
| --- | --- | --- | --- |
| 1 | الواجهة البرمجية تسمح بتكرار `sku` داخل نفس المؤسسة (201 لكليهما) بينما ترحيل SQL يفرض `UNIQUE(organization_id, sku)` | متوسطة | مزامنة قيود التطبيق مع قيود قاعدة البيانات وإرجاع 409 `DUPLICATE_SKU` |
| 2 | `apps/api/src/server.mjs` نسخة موازية من `server.ts` وقد بدأت تنحرف عنه (حقول مختلفة في المنتج) | متوسطة | إزالة النسخة المكرّرة أو توليدها من المصدر الوحيد |
| 3 | المصادقة شكلية: أي `Bearer` يُقبل، وتخزين في الذاكرة فقط (بلا PostgreSQL) | عالية قبل الإنتاج | موثّق كـ "شريحة مرجعية" في `apps/api/README.md`؛ يجب استبداله بـ JWT + RLS قبل أي إطلاق |
| 4 | إعادة تشغيل نفس `Idempotency-Key` بجسم مختلف تُرجع 200 بنتيجة العملية الأولى دون تنبيه | متوسطة | تخزين هاش للطلب وإرجاع 409 `IDEMPOTENCY_KEY_REUSE` عند الاختلاف |
| 5 | لا يوجد حدّ لحجم الجسم (`body size limit`) — `JSON.parse` على جسم غير محدود | متوسطة | فرض حد أقصى (مثلاً 1 MiB) وإرجاع 413 |
| 6 | `products`/`sales`/`seenIdempotency` خرائط غير محدودة النمو | منخفضة (شريحة) | TTL/تنظيف عند الانتقال إلى قاعدة البيانات |
| 7 | لا توجد سجلات تدقيق/`request-id`/حدّ معدّل للطلبات | منخفضة | إضافة middleware للتدقيق والتتبّع |
| 8 | `tests/security/` و`tests/sync/` فارغتان رغم أن وثائق المعمارية والأمن تفترض وجودهما | متوسطة | إضافة اختبارات عزل المستأجرين على مستوى SQL وسلامة outbox للمزامنة |
| 9 | `packages/contracts/src/sync.ts` بلا أي اختبار | منخفضة | اختبار عقد عقد المزامنة (idempotency + cursor) |
| 10 | سير عمل CI يتحقق من وجود ملفات فقط + gitleaks، ولا يشغّل `test`/`typecheck` | متوسطة | إضافة خطوات `npm ci && npm run typecheck && npm test` |
| 11 | إضافة `@types/node` و`typescript` كـ devDependencies تطلبت إنشاء `package-lock.json` (3 حزم) | — | الاعتماد على `npm ci` في CI |
| 12 | `dist/` لم يكن مُستثنى في `.gitignore` | منخفضة | أُضيف `dist/` إلى `.gitignore` |

## 6. الملفات المعدّلة

- `apps/api/src/server.ts` — إصلاح الاستيراد + بناء كائن المنتج بما يتوافق مع `exactOptionalPropertyTypes`.
- `tsconfig.json` — `allowImportingTsExtensions` + `rewriteRelativeImportExtensions`.
- `tests/integration/api.test.ts` — إعادة كتابة: منفذ ديناميكي، انتظار جاهزية، 6 اختبارات.
- `package.json` — سكربتات `test` / `test:smoke` / `test:all` + devDependencies.
- `package-lock.json` — جديد.
- `.gitignore` — إضافة `dist/`.
- استُخرج محتوى `azaz-business-working.tar.gz` إلى جذر المستودع (كان المشروع مضغوطاً فقط).

## 7. كيف تُعاد الاختبارات

```bash
npm ci                # لتثبيت أدوات الفحص (typescript + @types/node)
npm test              # اختبارات الوحدة + التكامل (7)
npm run test:smoke    # اختبار دخان لنسخة .mjs
npm run typecheck     # tsc --noEmit
npm run build         # بناء dist/
npm run security      # npm audit
make verify           # البوابة النهائية
```

## 8. ترقية سلسلة الأدوات (2026-10-31)

| العنصر | قبل | بعد |
| --- | --- | --- |
| `typescript` | 5.9.3 | **7.0.2** |
| `@types/node` | 22.20.5 (غير مثبّتة) | **22.20.5** (مثبّتة ومقفلة) |
| Node المطلوب (`engines`) | `>=22` | `>=22.18` |
| تشغيل TypeScript مباشرة | `--experimental-strip-types` (مهجور) | تجريد الأنواع الأصلي دون أعلام |
| `tsconfig.json` | — | `"types": ["node"]` (إلزامي في TS 7 لإدراج أنواع Node) |

### ما تغيّر
- **TS 7** لم يعد يضمّن `@types/*` تلقائياً؛ أُضيف `"types": ["node"]` إلى `tsconfig.json` ليبقى `tsc --noEmit` نظيفاً.
- **إسقاط العلم المهجور**: Node 22.18+ يفعّل تجريد أنواع TypeScript افتراضياً، لذا أُزيل `--experimental-strip-types` من سكربت `test` ومن أمر تشغيل الخادم داخل اختبار التكامل. رُفع `engines` إلى `>=22.18` كحد أدنى حقيقي.
- **مسار الجذر `GET /`**: يُرجع الآن بطاقة تعريف بالخدمة ونقاط النهاية (كان 404)، لتكون المعاينة الحيّة مفهومة، مع اختبار يغطيها.
- `rewriteRelativeImportExtensions` ما زال يعمل في TS 7: البناء ينتج `dist/apps/api/src/server.js` مع تحويل `./health.ts` إلى `./health.js` (مُتحقَّق منه بالتشغيل الفعلي).

### نتيجة إعادة الفحص بعد الترقية
`npm test` → 8/8 ناجح · `npm run test:smoke` → ناجح · `npm run typecheck` → نظيف · `npm run build` + تشغيل `dist` → يعمل · `npm audit` → 0 ثغرات · `make verify` → ناجح.
