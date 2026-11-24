# مکتب — ردیاب عادت (Maktab Habit Tracker)

PWA با سرور Node: ورود با شماره همراه و رمز، ذخیره‌ی داده‌ی هر کاربر روی سرور (و یک نسخه‌ی آفلاین در `localStorage`)،
یادآوری شبانه‌ی ساعت ۲۱:۳۰ (Web Push) با نام کارهای ناتمام، و صفحه‌ی مدیریت کاربران در `/admin`.

## انتشار روی Cloudflare (رایگان) — نسخه‌ی فعلی

اپ روی **https://habit.maktabagency.ir** با Cloudflare Workers + D1 اجرا می‌شود (پلن رایگان):
- `worker/index.js` همان API سرور Node را روی Workers اجرا می‌کند؛ `worker/webpush.js` ارسال اعلان بدون کتابخانه‌ی Node.
- دیتابیس: D1 به نام `maktab-habit` (جدول‌ها در `migrations/`).
- یادآوری: Cron هر ۱۵ دقیقه؛ هر کاربر ساعت `REMINDER_TIME` (۲۱:۳۰) به وقت خودش اعلان می‌گیرد.
- پنل کاربران: https://habit.maktabagency.ir/admin — نام کاربری `admin`، رمز در secret به نام `ADMIN_PASSWORD`.

انتشار نسخه‌ی تازه (بعد از `npx wrangler login`):

```bash
npm ci
npm run deploy
```

secretها (فقط یک بار؛ تغییر `VAPID_PRIVATE_KEY` اشتراک اعلان همه‌ی کاربران را باطل می‌کند):

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put VAPID_PRIVATE_KEY
```

دیدن کاربران از خط فرمان: `npx wrangler d1 execute maktab-habit --remote --command "SELECT name, phone, created_at FROM users"`

## راه‌اندازی روی سرور Node (جایگزین)

نیاز: Node.js نسخه‌ی 22.13 یا بالاتر (از `node:sqlite` داخلی استفاده می‌شود) و دامنه با **HTTPS** (برای نصب PWA و اعلان الزامی است).

```bash
npm ci
npm run build
ADMIN_PASSWORD='یک-رمز-قوی' VAPID_SUBJECT='mailto:you@example.com' npm start
```

| متغیر | پیش‌فرض | توضیح |
|---|---|---|
| `PORT` | `8080` | پورت سرور (پشت nginx/Caddy با HTTPS) |
| `DATA_DIR` | `./data` | پایگاه‌داده‌ی SQLite و کلیدهای VAPID — **از این پوشه پشتیبان بگیر و آن را پاک نکن** (با پاک شدن `vapid.json` اشتراک اعلان همه‌ی کاربران باطل می‌شود) |
| `ADMIN_PASSWORD` | — | بدون آن `/admin` خاموش است. ورود: نام کاربری `admin` و همین رمز |
| `REMINDER_TIME` | `21:30` | ساعت یادآوری به وقت محلی هر کاربر |
| `VAPID_SUBJECT` | `mailto:admin@example.com` | ایمیل یا آدرس سایت شما برای سرویس‌های Push |
| `COOKIE_SECURE` | خودکار | `1` = کوکی همیشه Secure |

صفحه‌ی `/admin`: فهرست کاربران (نام، شماره، تاریخ ثبت‌نام، آخرین فعالیت، روزهای ثبت‌شده، وضعیت یادآوری)، دریافت CSV، ارسال یادآوری آزمایشی و ساخت رمز تازه برای کسی که رمزش را فراموش کرده. رمزها هش (scrypt) ذخیره می‌شوند و قابل خواندن نیستند.

نکته‌ها:
- اعلان در آیفون فقط وقتی کار می‌کند که اپ با Add to Home Screen نصب شده باشد (iOS 16.4+).
- در اندروید، Chrome اعلان‌ها را از طریق سرویس Push گوگل (FCM) می‌فرستد؛ اگر دسترسی گوشی به سرویس‌های گوگل محدود باشد اعلان ممکن است دیر برسد یا نرسد.

## اجرا

```bash
npm install
npm start          # سرور (بعد از npm run build) روی http://localhost:8080
npm run dev        # توسعه‌ی رابط (درخواست‌های /api به npm start پروکسی می‌شود)
npm test           # تست واحد
npm run build      # typecheck + خروجی نهایی در dist/
npm run preview    # سرو کردن dist برای تست
python3 -I tests/e2e/smoke.py http://localhost:4173/ <screenshot-dir>   # تست E2E (Playwright)
python3 -I tests/e2e/offline.py http://localhost:4173/                  # تست آفلاین
```

`sw.js` نباید طولانی کش شود (Cache-Control: no-cache) تا به‌روزرسانی‌ها به کاربر برسد.

## ساختار

```
src/
  domain/      منطق خالص و تست‌شده
    jalali.ts    تبدیل شمسی ⇄ میلادی (الگوریتم Borkowski، بدون وابستگی به Date/منطقه‌ی زمانی)
    dates.ts     DayKey محلی (نیمه‌شب گوشی، نه UTC)، ماه، روز هفته (شنبه = 0)
    types.ts     مدل داده (AppData نسخه‌ی 1)
    defaults.ts  فهرست پیش‌فرض تسک‌ها و ظرف‌ها
    scoring.ts   امتیاز روز، سطح، پیوستگی (streak)، نرخ هر عادت
    tasks.ts     افزودن / ویرایش / جابه‌جایی / حذف تسک (حذف = پاک شدن کل سابقه)
    water.ts     آب‌سنج، هدف، اعتبارسنجی
    records.ts   ثبت وضعیت و ژورنال
  storage/     ذخیره‌سازی نسخه‌دار، اعتبارسنجی سخت‌گیرانه، پشتیبان JSON
  ui/          صفحه‌ها، شیت‌ها، نمودار SVG، store
  net/         ارتباط با سرور، همگام‌سازی و ادغام سه‌طرفه‌ی داده‌ی دو دستگاه
  pwa/         ثبت service worker، قالب sw.js، اشتراک اعلان شبانه
  styles/      توکن‌های برند مکتب
  assets/      فونت‌های محلی (Vazirmatn، IBM Plex Sans — OFL) و نشانه
public/        manifest، آیکون‌ها، مجوز فونت‌ها
tests/         تست‌های واحد (Vitest) و E2E (Playwright)
server/        سرور Node: حساب‌ها، داده، یادآوری شبانه، /admin
```

## قواعد محصول (تصمیم‌های تأییدشده)

- امتیاز: کامل 2، ناقص 1، انجام‌نشده/ثبت‌نشده 0. سطح‌ها: 90+ فوق‌العاده، 70+ عالی، 40+ خوب.
- روز ثبت‌نشده امتیاز ندارد و در نمودار خط را قطع می‌کند.
- تسک تازه از روز ساخت حساب می‌شود؛ حذف تسک کل سابقه‌اش را پاک و امتیازها را دوباره حساب می‌کند.
- سه دسته‌ی اصلی ثابت‌اند؛ تسک‌ها بین آن‌ها جابه‌جا می‌شوند.
- ژورنال، عادت «ژورنال‌نویسی» را خودکار کامل می‌کند؛ انتخاب دستی اولویت دارد.
- هدف آب در اولین ثبت آبِ هر روز برای همان روز ثبت می‌شود؛ تغییر هدف سابقه را عوض نمی‌کند.
- روزهای آینده بسته‌اند؛ روزهای گذشته قابل ویرایش‌اند.
