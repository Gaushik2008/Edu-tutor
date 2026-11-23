"""Real-browser checks (headless Chromium via Playwright): landing, navigation, lesson, mobile overflow.
Run:  pip install playwright && playwright install chromium && python demo/tests/e2e_browser.py index.html /tmp
Not part of CI (needs a browser)."""
import sys, asyncio
from playwright.async_api import async_playwright
import os
path = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "index.html")
out = sys.argv[2] if len(sys.argv) > 2 else "/tmp"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); errs = []; res = []
        def chk(name, ok): res.append((name, bool(ok)))
        ctx = await b.new_context(viewport=dict(width=1440, height=900))
        pg = await ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file://" + path); await pg.wait_for_timeout(1500)
        chk("landing visible", await pg.is_visible("#land"))
        txt = await pg.inner_text(".l-cards")
        chk("misconception card detects pattern", "Believes current rises" in txt)
        strip = await pg.inner_text(".l-strip")
        chk("stats strip has 12/39/12/9", all(x in strip for x in ("12","39","9")))
        # every landing button does something
        for sel, expect in (("[data-l=student].l-pill", "Welcome back"), ):
            pass
        await pg.click(".l-links [data-l=teacher]"); await pg.wait_for_timeout(300)
        chk("teacher link opens heatmap", not await pg.is_visible("#land") and "Class overview" in await pg.inner_text("#app"))
        await pg.click("[data-home]"); await pg.wait_for_timeout(300)
        chk("brand reopens landing", await pg.is_visible("#land"))
        await pg.click(".l-nav .l-pill"); await pg.wait_for_timeout(300)
        chk("start learning opens diagnostic", "Diagnostic" in await pg.inner_text("#app"))
        await pg.click("[data-home]"); await pg.wait_for_timeout(200)
        await pg.click("[data-l=watch]"); await pg.wait_for_timeout(1200)
        chk("watch opens Electric Charge lesson", await pg.is_visible("#cv"))
        await pg.click("#pp"); await pg.wait_for_timeout(1500)
        chk("lesson plays", "Pause" in await pg.inner_text("#pp"))
        await pg.click("[data-home]"); await pg.wait_for_timeout(200)
        await pg.click(".l-card [data-l=practise]"); await pg.wait_for_timeout(300)
        chk("practise opens a question", await pg.is_visible("[data-submit]"))
        await pg.reload(); await pg.wait_for_timeout(800)
        chk("reload in same session skips landing", not await pg.is_visible("#land"))
        await pg.screenshot(path=f"{out}/e-app.png")
        # reduced motion renders a still frame, no errors
        rm = await b.new_context(viewport=dict(width=1440, height=900), reduced_motion="reduce")
        rp = await rm.new_page(); rp.on("pageerror", lambda e: errs.append("rm:"+str(e)))
        await rp.goto("file://" + path); await rp.wait_for_timeout(800)
        chk("reduced-motion landing shows headline", await rp.is_visible("#land h1"))
        # mobile
        m = await b.new_context(viewport=dict(width=390, height=844), is_mobile=True, has_touch=True, device_scale_factor=2)
        mp = await m.new_page(); mp.on("pageerror", lambda e: errs.append("m:"+str(e)))
        await mp.goto("file://" + path); await mp.wait_for_timeout(2500)
        await mp.screenshot(path=f"{out}/m-hero.png")
        sw = await mp.evaluate("document.getElementById('land').scrollWidth <= document.getElementById('land').clientWidth+1")
        chk("mobile landing has no horizontal overflow", sw)
        await mp.evaluate("document.getElementById('l-how').scrollIntoView()"); await mp.wait_for_timeout(500)
        await mp.screenshot(path=f"{out}/m-how.png")
        await mp.click(".l-end [data-l=student]"); await mp.wait_for_timeout(400)
        await mp.screenshot(path=f"{out}/m-app.png")
        ov = await mp.evaluate("document.documentElement.scrollWidth <= window.innerWidth+1")
        chk("mobile app has no horizontal overflow", ov)
        await b.close()
        for n, ok in res: print(("PASS " if ok else "FAIL ") + n)
        print("page errors:", errs)
asyncio.run(main())
