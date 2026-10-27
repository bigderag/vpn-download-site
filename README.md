# دانلود OpenVPN

**نسخه آنلاین:** [bigderag.github.io/vpn-download-site](https://bigderag.github.io/vpn-download-site/)

صفحه‌ی دانلود OpenVPN و کانفیگ‌های آماده با رابط کاربری فارسی، واکنش‌گرا و پشتیبانی از حالت روشن و تاریک.

## اجرای محلی

```bash
npm install
npm start
```

سایت روی <http://localhost:3000> اجرا می‌شود.

## نسخه‌ی استاتیک

برای ساخت خروجی استاتیک (مورد استفاده در GitHub Pages):

```bash
npm run build:static
```

فایل‌های خروجی در پوشه‌ی `dist/` ساخته می‌شوند.

## انتشار روی GitHub Pages

Workflow موجود در `.github/workflows/deploy-pages.yml` پس از هر push به شاخه‌ی `main`، نسخه‌ی استاتیک را می‌سازد و روی GitHub Pages منتشر می‌کند.

در تنظیمات مخزن، بخش **Settings → Pages** را روی **GitHub Actions** قرار دهید.

## ساختار پروژه

- `server.js` — وب‌سرور Express برای اجرای محلی
- `views/index.ejs` — قالب اصلی صفحه
- `public/` — استایل‌ها، اسکریپت‌ها، فونت‌ها و لوگوها
- `scripts/build-static.js` — سازنده‌ی خروجی استاتیک
- `dist/` — خروجی ساخت (در مخزن نگه‌داری نمی‌شود)
