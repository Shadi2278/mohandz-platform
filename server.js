const express = require('express');
const path = require('path');
const app = express();

// استيراد الخادم الرئيسي من admin-api
const adminApi = require('./admin-api/server');

// تعيين المنفذ من متغيرات البيئة أو استخدام 10000 كمنفذ افتراضي
const PORT = process.env.PORT || 10000;

// الاستماع على المنفذ المحدد وعلى جميع الواجهات
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
