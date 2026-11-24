"""
End-to-end smoke test against the production build (vite preview).
Phone viewport, Tehran time zone, clock fixed to 2 Aban 1405 (2026-10-24) 10:00.
Usage: python3 -I tests/e2e/smoke.py <base_url> <screenshot_dir>
"""
import json
import sys
from datetime import datetime, timezone, timedelta

from playwright.sync_api import sync_playwright, expect

BASE = sys.argv[1]
OUT = sys.argv[2]
TEHRAN = timezone(timedelta(hours=3, minutes=30))
NOW = datetime(2026, 10, 24, 10, 0, tzinfo=TEHRAN)

errors: list[str] = []
results: list[tuple[str, bool, str]] = []


def check(name: str, cond: bool, detail: str = "") -> None:
    results.append((name, bool(cond), detail))


def shot(page, name: str) -> None:
    page.wait_for_timeout(500)
    page.screenshot(path=f"{OUT}/{name}.png", full_page=False)


SEED = """
() => {
  const key = 'maktab.habit.v1';
  const data = JSON.parse(localStorage.getItem(key));
  data.firstUse = '2026-09-23'; // 1 Mehr 1405
  const statuses = ['done', 'done', 'done', 'partial', 'missed'];
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const start = new Date(Date.UTC(2026, 8, 23));
  for (let i = 0; i < 31; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const day = d.toISOString().slice(0, 10);
    if (day === '2026-09-30' || day === '2026-10-01' || day === '2026-10-12') continue; // gaps
    const rec = { tasks: {}, water: {}, journal: '' };
    for (const t of data.tasks) {
      if (t.link === 'water') continue;
      rec.tasks[t.id] = statuses[Math.floor(rnd() * statuses.length)];
    }
    rec.water['c-cooler-cup'] = { name: 'لیوان آب‌سردکن', ml: 220, count: 2 + Math.floor(rnd() * 10) };
    rec.waterGoal = { fullMl: 3000, partialMl: 1500 };
    if (rnd() > 0.5) rec.journal = 'سپاسگزارم برای یک روز آرام.';
    data.days[day] = rec;
  }
  localStorage.setItem(key, JSON.stringify(data));
}
"""

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True,
        locale="fa-IR",
        timezone_id="Asia/Tehran",
    )
    page = ctx.new_page()
    page.clock.install(time=NOW)
    page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))

    page.goto(BASE)
    page.wait_for_selector(".score")

    # ---- Header date & default list
    date_text = page.locator("#date-btn").inner_text()
    check("header shows Saturday 2 Aban", "شنبه، 2 آبان" in date_text, date_text)
    morning = page.locator("#cat-morning").locator("xpath=../../..").locator(".task__name").all_inner_texts()
    check("Instagram task is first in morning", morning and morning[0].startswith("بدون اینستاگرام بعد از بیدار شدن"), str(morning[:2]))
    check("17 default tasks", page.locator(".task").count() == 17, str(page.locator(".task").count()))
    shot(page, "01-today-empty")

    # ---- Status toggles and score
    page.click('[data-action="set-status"][data-task="t-exercise"][data-status="done"]')
    page.click('[data-action="set-status"][data-task="t-food"][data-status="partial"]')
    page.click('[data-action="set-status"][data-task="t-reading"][data-status="missed"]')
    score = page.locator(".score .num").first.inner_text()
    check("score after 2+1 points = 3/34 → 9%", "9" in score, score)
    check("score detail 3 / 34", page.locator(".score__meta .num").inner_text().strip() == "3 / 34", page.locator(".score__meta .num").inner_text())
    page.click('[data-action="set-status"][data-task="t-exercise"][data-status="done"]')  # toggle off
    check("tapping active state clears it", page.locator('[data-task="t-exercise"][data-status="done"]').get_attribute("aria-pressed") == "false")
    page.click('[data-action="set-status"][data-task="t-exercise"][data-status="done"]')

    # ---- Journal auto-completes journaling task
    page.fill("#journal", "امروز بابت سلامتی و خانواده شکرگزارم.")
    page.click(".score")  # blur → re-render
    page.wait_for_timeout(200)
    auto = page.locator(".task__auto").count()
    check("journal auto-completes journaling task", auto == 1, str(auto))
    page.locator("#journal").scroll_into_view_if_needed()
    shot(page, "02-today-journal")
    page.reload()
    page.wait_for_selector(".score")
    check("journal persisted after reload", page.locator("#journal").input_value().startswith("امروز بابت"))
    check("statuses persisted after reload",
          page.locator('[data-task="t-food"][data-status="partial"]').get_attribute("aria-pressed") == "true")

    # ---- Edit tasks: add, rename/move, reorder, delete
    page.evaluate("window.scrollTo(0,0)")
    page.click('[data-action="toggle-edit-tasks"]')
    shot(page, "03-edit-mode")
    page.click('[data-action="add-task"][data-category="morning"]')
    page.wait_for_timeout(500)
    shot(page, "04-add-task-sheet")
    page.fill('form[data-form="task"] input[name="name"]', "نرمش صبحگاهی")
    page.click('form[data-form="task"] button[type="submit"]')
    page.wait_for_timeout(300)
    morning_edit = page.locator("#cat-morning").locator("xpath=../../..").locator(".task__name").all_inner_texts()
    check("new task added at end of morning", "نرمش صبحگاهی" in morning_edit[-1], str(morning_edit))
    page.click('[data-action="move-task"][data-task="t-minox-am"][data-dir="-1"]')
    morning_edit = page.locator("#cat-morning").locator("xpath=../../..").locator(".task__name").all_inner_texts()
    check("reorder moves minoxidil to top", morning_edit[0].startswith("ماینوکسیدیل صبح"), str(morning_edit[:2]))
    page.click('[data-action="edit-task"][data-task="t-bed"]')
    page.wait_for_timeout(400)
    page.fill('form[data-form="task"] input[name="name"]', "مرتب کردن اتاق")
    page.select_option('form[data-form="task"] select[name="category"]', "night")
    page.click('form[data-form="task"] button[type="submit"]')
    page.wait_for_timeout(300)
    night = page.locator("#cat-night").locator("xpath=../../..").locator(".task__name").all_inner_texts()
    check("rename + move to night", "مرتب کردن اتاق" in night[-1], str(night[-2:]))
    # empty name validation
    page.click('[data-action="add-task"][data-category="day"]')
    page.wait_for_timeout(400)
    page.click('form[data-form="task"] button[type="submit"]')
    err = page.locator("form[data-form='task'] [data-error]").inner_text()
    check("empty task name rejected", "نام تسک" in err, err)
    page.click('.sheet__head [data-action="sheet-close"]')
    page.wait_for_timeout(500)
    # delete with confirmation
    page.click('[data-action="edit-task"][data-task="t-exercise"]')
    page.wait_for_timeout(400)
    page.click('[data-action="delete-task"]')
    page.wait_for_timeout(500)
    shot(page, "05-delete-confirm")
    page.click('[data-confirm="yes"]')
    page.wait_for_timeout(400)
    check("deleted task gone", page.locator('[data-task="t-exercise"]').count() == 0)
    page.click('[data-action="toggle-edit-tasks"]')
    check("max score now 34 (17 tasks incl. new one, minus exercise)",
          page.locator(".score__meta .num").inner_text().strip().endswith("/ 34"), page.locator(".score__meta .num").inner_text())

    # ---- Water
    page.click('.nav__btn[data-tab="water"]')
    for _ in range(3):
        page.click('[data-action="water"][data-id="c-cooler-cup"][data-delta="1"]')
    page.click('[data-action="water"][data-id="c-bottle-small"][data-delta="1"]')
    total = page.locator(".water-total__value").inner_text()
    check("water total 3×220 + 500 = 1.16 L", total.startswith("1.16"), total)
    shot(page, "06-water")
    page.click('[data-action="toggle-edit-containers"]')
    page.click('[data-action="add-container"]')
    page.wait_for_timeout(400)
    page.fill('form[data-form="container"] input[name="name"]', "قمقمه")
    page.fill('form[data-form="container"] input[name="ml"]', "۷۵۰")
    page.click('form[data-form="container"] button[type="submit"]')
    page.wait_for_timeout(300)
    check("custom container added (Persian digits accepted)", page.get_by_text("قمقمه").count() == 1)
    page.click('[data-action="delete-container"][data-id="c-cooler-cup"]')
    page.wait_for_timeout(400)
    page.click('[data-confirm="yes"]')
    page.wait_for_timeout(400)
    page.click('[data-action="toggle-edit-containers"]')
    total2 = page.locator(".water-total__value").inner_text()
    check("deleting a container keeps today's total", total2.startswith("1.16"), total2)
    check("deleted container shown as removable entry", page.get_by_text("(حذف‌شده)").count() == 1)
    shot(page, "07-water-after-delete")

    # ---- Seed a month of history and view month screens
    page.evaluate(SEED)
    page.reload()
    page.wait_for_selector(".nav")
    page.click('.nav__btn[data-tab="history"]')
    check("history header shows month", "آبان 1405" in page.locator("#date-btn").inner_text())
    shot(page, "08-history-aban")
    check("next month blocked on the current month", page.locator('[data-action="month"][data-delta="1"]').is_disabled())
    page.click('[data-action="month"][data-delta="-1"]')
    check("history navigates to Mehr", "مهر 1405" in page.locator(".month-nav__title").inner_text())
    rows = page.locator(".day-row").count()
    check("Mehr shows 30 days", rows == 30, str(rows))
    shot(page, "09-history-mehr")

    page.click('.nav__btn[data-tab="dashboard"]')
    shot(page, "10-dashboard")
    # 1 Mehr 1405 = 2026-09-23, a Wednesday → 4 blanks before day 1 (Sat, Sun, Mon, Tue).
    blanks = page.evaluate("""() => { const c = document.querySelector('.cal'); let n = 0;
        for (const el of c.children) { if (el.classList.contains('cal__dow')) continue; if (el.tagName === 'DIV') n++; else break; } return n; }""")
    check("Mehr 1405 grid offset = 4 (starts Wednesday)", blanks == 4, str(blanks))

    page.click('.nav__btn[data-tab="stats"]')
    page.wait_for_selector(".chart")
    segs = page.evaluate("() => (document.querySelector('.chart path').getAttribute('d').match(/M/g) || []).length")
    check("chart line breaks at unrecorded days (3 segments in Mehr)", segs == 3, str(segs))
    dots = page.locator('.chart circle[data-action="chart-point"]').count()
    check("one point per recorded day (27 in Mehr)", dots == 27, str(dots))
    shot(page, "11-stats-chart")
    page.locator('.chart circle[data-action="chart-point"]').nth(10).dispatch_event("click")
    page.wait_for_timeout(200)
    readout = page.locator(".chart__readout").inner_text()
    check("tapping a point shows its day and percent", "مهر" in readout and "%" in readout, readout)
    shot(page, "12-stats-selected")

    # ---- Date picker → open a past day, future days disabled
    page.click("#date-btn")
    page.wait_for_timeout(500)
    shot(page, "13-picker")
    page.click('[data-action="picker-month"][data-delta="1"]')
    future_disabled = page.locator('[data-action="picker-day"][data-day="2026-10-25"]').is_disabled()
    check("future day disabled in picker", future_disabled)
    page.click('[data-action="picker-month"][data-delta="-1"]')
    page.click('[data-action="picker-day"][data-day="2026-10-20"]')
    page.wait_for_timeout(400)
    check("past day opens on Today screen", "28 مهر" in page.locator("#date-btn").inner_text() or "28 مهر" in page.locator(".banner").first.inner_text(),
          page.locator("#date-btn").inner_text())
    check("past-day banner visible", page.get_by_text("بازگشت به امروز").count() == 1)
    shot(page, "14-past-day")
    # editing a past day's water must not change today's
    page.click('.nav__btn[data-tab="water"]')
    page.click('[data-action="water"][data-id="c-bottle-large"][data-delta="1"]')
    page.click('[data-action="go-today"]')
    total3 = page.locator(".water-total__value").inner_text()
    check("past-day water edit leaves today unchanged", total3.startswith("1.16"), total3)

    # ---- Settings: goal validation, backup, contact
    page.click('[data-action="tab"][data-tab="settings"]')
    page.fill('form[data-form="goal"] input[name="full"]', "1")
    page.fill('form[data-form="goal"] input[name="partial"]', "2")
    page.click('form[data-form="goal"] button[type="submit"]')
    check("invalid goal rejected", "بیشتر" in page.locator('form[data-form="goal"] [data-error]').inner_text())
    page.fill('form[data-form="goal"] input[name="full"]', "2.5")
    page.fill('form[data-form="goal"] input[name="partial"]', "1.2")
    page.click('form[data-form="goal"] button[type="submit"]')
    stored_goal = page.evaluate("() => JSON.parse(localStorage.getItem('maktab.habit.v1')).waterGoal")
    check("goal saved", stored_goal == {"fullMl": 2500, "partialMl": 1200}, json.dumps(stored_goal))
    with page.expect_download() as dl:
        page.click('[data-action="export-backup"]')
    path = dl.value.path()
    backup = json.loads(open(path, encoding="utf-8").read())
    check("backup file downloaded", backup.get("app") == "maktab-habit" and len(backup["data"]["days"]) >= 28, dl.value.suggested_filename)
    mail = page.locator('.fine-print a').get_attribute("href")
    check("contact email link", mail == "mailto:bardia.bkhaledi@gmail.com", mail or "")
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    shot(page, "15-settings")

    # restore from backup after wiping
    page.evaluate("() => { const d = JSON.parse(localStorage.getItem('maktab.habit.v1')); d.days = {}; localStorage.setItem('maktab.habit.v1', JSON.stringify(d)); }")
    page.reload()
    page.wait_for_selector(".nav")
    page.set_input_files("#backup-file", path)
    page.wait_for_timeout(500)
    page.click('[data-confirm="yes"]')
    page.wait_for_timeout(400)
    restored = page.evaluate("() => Object.keys(JSON.parse(localStorage.getItem('maktab.habit.v1')).days).length")
    check("backup restore brings history back", restored >= 28, str(restored))

    # ---- XSS: task names are escaped
    page.click('.nav__btn[data-tab="today"]')
    page.click('[data-action="toggle-edit-tasks"]')
    page.click('[data-action="add-task"][data-category="night"]')
    page.wait_for_timeout(400)
    page.fill('form[data-form="task"] input[name="name"]', '<img src=x onerror="window.__xss=1">')
    page.click('form[data-form="task"] button[type="submit"]')
    page.wait_for_timeout(300)
    check("HTML in task names is not executed", page.evaluate("() => window.__xss === undefined"))

    # ---- Midnight rollover: app moves to the new day
    page.click('[data-action="toggle-edit-tasks"]')
    page.clock.run_for(14 * 60 * 60 * 1000 + 61_000)  # → 00:01 next day
    page.wait_for_timeout(300)
    check("midnight rollover moves to 3 Aban", "3 آبان" in page.locator("#date-btn").inner_text(), page.locator("#date-btn").inner_text())

    # ---- PWA basics
    manifest = page.evaluate("() => fetch('./manifest.webmanifest').then(r => r.json())")
    check("manifest is valid & standalone", manifest.get("display") == "standalone" and len(manifest.get("icons", [])) == 3)

    browser.close()

passed = sum(1 for _, ok, _ in results if ok)
for name, ok, detail in results:
    print(f"{'PASS' if ok else 'FAIL'}  {name}{'' if ok else '  →  ' + detail}")
print(f"\n{passed}/{len(results)} checks passed")
print("Console/page errors:", errors if errors else "none")
sys.exit(0 if passed == len(results) and not errors else 1)
