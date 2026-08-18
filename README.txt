روزنا - تحديث المزامنة المشتركة

الملفات:
- worker.js: API للتخزين المشترك في D1 + حقن sync.js
- sync.js: مزامنة بيانات rozana_app_v2 بين الأجهزة
- wrangler.jsonc: يجعل Worker يمر على صفحات HTML لحقن المزامنة
- schema.sql: جدول app_state

مهم:
1) في Cloudflare اربط D1 database باسم rozana-db بالـ Worker Binding Name: DB.
2) نفّذ schema.sql مرة واحدة على قاعدة D1.
3) ارفع/استبدل الملفات الأربعة في نفس مستودع GitHub ونفس branch main.
4) لا تنشئ موقعًا جديدًا.

الاستيراد:
الكود الحالي أصلًا يبحث عن العاملة برقم الجواز ثم رقم الملف ويحدّث الموجودة بدل تكرارها.
