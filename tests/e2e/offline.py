"""Offline check: after one online visit, the app must reload and work with the network off.
Usage: python3 -I tests/e2e/offline.py <base_url>"""
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1]
ok = True
with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, service_workers="allow")
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(BASE)
    page.wait_for_selector(".score")
    page.evaluate("() => navigator.serviceWorker.ready.then(() => true)")
    page.reload()  # second load is controlled by the worker
    page.wait_for_function("() => !!navigator.serviceWorker.controller")
    cached = page.evaluate("() => caches.keys().then(async ks => (await (await caches.open(ks[0])).keys()).length)")
    print(f"precached entries: {cached}")
    page.click('[data-action="set-status"][data-task="t-bed"][data-status="done"]')

    ctx.set_offline(True)
    page.reload()
    page.wait_for_selector(".score", timeout=5000)
    fonts_ok = page.evaluate("() => document.fonts.ready.then(() => [...document.fonts].filter(f => f.status === 'loaded').length)")
    persisted = page.locator('[data-task="t-bed"][data-status="done"]').get_attribute("aria-pressed") == "true"
    print(f"offline reload rendered: True, fonts loaded offline: {fonts_ok}, data intact: {persisted}")
    ok = persisted and fonts_ok > 0 and cached >= 15 and not errors
    if errors:
        print("errors:", errors)
    browser.close()
print("OFFLINE PASS" if ok else "OFFLINE FAIL")
sys.exit(0 if ok else 1)
