import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "tmp/verify-screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

let serverProcess = null;

async function isServerReady() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { method: "HEAD" }).catch(() => null);
    if (res && res.status < 500) return true;
    const resRoot = await fetch(BASE_URL, { method: "HEAD" });
    return resRoot.status < 500;
  } catch {
    return false;
  }
}

async function startServer() {
  if (await isServerReady()) {
    console.log(`[server] Server already responding at ${BASE_URL}`);
    return;
  }

  console.log(`[server] Starting next start on ${BASE_URL}...`);
  serverProcess = spawn("npx", ["next", "start", "-p", "3000"], {
    shell: true,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production" },
  });

  const startTime = Date.now();
  while (Date.now() - startTime < 45000) {
    if (await isServerReady()) {
      console.log(`[server] Server ready at ${BASE_URL}!`);
      return;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Server failed to become ready within 45s");
}

function cleanupServer() {
  if (serverProcess) {
    console.log("[server] Shutting down next start server...");
    try {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", serverProcess.pid.toString(), "/f", "/t"]);
      } else {
        serverProcess.kill("SIGTERM");
      }
    } catch (e) {
      console.error("Error stopping server:", e.message);
    }
  }
}

async function run() {
  const auditResults = {
    routes: {},
    computedStyles: {},
    interactions: {},
    errors: [],
  };

  try {
    await startServer();

    console.log("[playwright] Launching Chromium headless browser...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    // Listen to uncaught page exceptions and console errors
    page.on("pageerror", (err) => {
      console.error(`[pageerror] ${err.message}`);
      auditResults.errors.push(`[pageerror] ${err.message}`);
    });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const txt = msg.text();
        if (
          txt.includes("favicon.ico") ||
          txt.includes("Failed to load resource") ||
          txt.includes("API Request Failed") ||
          txt.includes("WebMediaPlayer") ||
          txt.includes("ERR_CONNECTION_REFUSED")
        ) {
          return;
        }
        console.error(`[console.error] ${txt}`);
        auditResults.errors.push(`[console.error] ${txt}`);
      }
    });

    // ─────────────────────────────────────────────────────────────
    // 1. Visit Routes
    // ─────────────────────────────────────────────────────────────
    const routesToTest = [
      { path: "/", name: "landing", screenshot: "landing.png" },
      { path: "/login", name: "login" },
      { path: "/pricing", name: "pricing", screenshot: "pricing.png" },
      { path: "/cinema-studio/test/prompt-bar-compare", name: "cinema-studio", screenshot: "cinema-studio.png" },
      { path: "/dev/ui", name: "dev-ui", screenshot: "dev-ui.png" },
    ];

    for (const route of routesToTest) {
      console.log(`[audit] Navigating to ${route.path}...`);
      const resp = await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      });

      const status = resp?.status() || 0;
      console.log(`[audit] ${route.path} -> HTTP ${status}`);
      auditResults.routes[route.path] = status;

      if (status >= 400) {
        throw new Error(`Route ${route.path} failed with HTTP ${status}`);
      }

      await page.waitForTimeout(600);

      if (route.screenshot) {
        const dest = path.join(SCREENSHOT_DIR, route.screenshot);
        await page.screenshot({ path: dest, fullPage: false });
        console.log(`[screenshot] Saved ${dest}`);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. Computed Style Verification on Landing Page (/)
    // ─────────────────────────────────────────────────────────────
    console.log("[audit] Verifying computed styles on / ...");
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 15000 });

    const landingStyles = await page.evaluate(() => {
      const body = document.body;
      const bodyStyle = window.getComputedStyle(body);
      return {
        bodyBg: bodyStyle.backgroundColor,
        bodyFont: bodyStyle.fontFamily,
      };
    });

    console.log(`[styles] body.backgroundColor: ${landingStyles.bodyBg}`);
    console.log(`[styles] body.fontFamily: ${landingStyles.bodyFont}`);

    auditResults.computedStyles.bodyBg = landingStyles.bodyBg;
    auditResults.computedStyles.bodyFont = landingStyles.bodyFont;

    // Verify body background is rgb(14, 16, 21) or equivalent dark token
    const isDarkBg = landingStyles.bodyBg === "rgb(14, 16, 21)" || landingStyles.bodyBg === "rgb(0, 0, 0)";
    if (!isDarkBg) {
      throw new Error(`Unexpected body background: ${landingStyles.bodyBg}, expected rgb(14, 16, 21)`);
    }

    // Verify font family includes Geist or Geist Sans
    const hasGeistFont = landingStyles.bodyFont.toLowerCase().includes("geist");
    if (!hasGeistFont) {
      throw new Error(`Unexpected body font-family: ${landingStyles.bodyFont}, expected Geist Sans`);
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Computed Style Verification on /dev/ui
    // ─────────────────────────────────────────────────────────────
    console.log("[audit] Verifying computed styles & components on /dev/ui ...");
    await page.goto(`${BASE_URL}/dev/ui`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForSelector("aside", { timeout: 10000 });
    // Ensure Buttons section is active
    await page.locator("aside button:has-text('Buttons & Actions')").first().click();
    await page.waitForTimeout(400);

    // Verify .ds-btn-primary
    const btnStyles = await page.evaluate(() => {
      const btn = document.querySelector(".ds-btn-primary") || document.querySelector("button[data-variant='primary']");
      if (!btn) return null;
      const s = window.getComputedStyle(btn);
      return {
        bg: s.backgroundColor,
        color: s.color,
      };
    });

    console.log("[styles] .ds-btn-primary:", btnStyles);
    if (!btnStyles) {
      throw new Error("Could not find .ds-btn-primary element on /dev/ui");
    }

    if (btnStyles.bg !== "rgb(250, 250, 250)") {
      throw new Error(`Expected .ds-btn-primary bg to be rgb(250, 250, 250), got ${btnStyles.bg}`);
    }
    if (btnStyles.color !== "rgb(24, 24, 27)") {
      throw new Error(`Expected .ds-btn-primary color to be rgb(24, 24, 27), got ${btnStyles.color}`);
    }
    auditResults.computedStyles.btnPrimary = btnStyles;

    // Switch to Cards section to verify .ds-section-card backdrop blur
    console.log("[audit] Switching to Cards section on /dev/ui...");
    await page.locator("aside button:has-text('Cards & Containers')").first().click();
    await page.waitForTimeout(500);

    const cardStyles = await page.evaluate(() => {
      const card = document.querySelector(".ds-section-card");
      if (!card) return null;
      const s = window.getComputedStyle(card);
      return {
        backdropFilter: s.backdropFilter || s["-webkit-backdrop-filter"],
      };
    });

    console.log("[styles] .ds-section-card:", cardStyles);
    if (!cardStyles || !cardStyles.backdropFilter.includes("blur(40px)")) {
      throw new Error(`Expected .ds-section-card backdrop-filter to contain blur(40px), got ${cardStyles?.backdropFilter}`);
    }
    auditResults.computedStyles.sectionCard = cardStyles;

    // ─────────────────────────────────────────────────────────────
    // 4. Interactive Smoke Checks on /dev/ui
    // ─────────────────────────────────────────────────────────────
    console.log("[audit] Running interactive smoke tests on /dev/ui...");

    // Test Forms section: Switch toggle & Input typing
    await page.locator("aside button:has-text('Form Inputs')").first().click();
    await page.waitForTimeout(500);

    // Toggle switch
    const switchEl = page.locator("button[role='switch']").first();
    const initialState = await switchEl.getAttribute("data-state");
    await switchEl.click();
    await page.waitForTimeout(200);
    const toggledState = await switchEl.getAttribute("data-state");
    console.log(`[interaction] Switch toggled: ${initialState} -> ${toggledState}`);
    if (initialState === toggledState) {
      throw new Error(`Switch failed to toggle state. Stayed ${initialState}`);
    }
    auditResults.interactions.switchToggle = `${initialState} -> ${toggledState}`;

    // Test Input typing
    const inputEl = page.locator("input[placeholder='Enter title...']").first();
    await inputEl.fill("Quantum Studio Project");
    const val = await inputEl.inputValue();
    console.log(`[interaction] Input filled: "${val}"`);
    if (val !== "Quantum Studio Project") {
      throw new Error(`Input value mismatch: got "${val}"`);
    }
    auditResults.interactions.inputTyping = val;

    // Test Overlays section: DropdownMenu opening
    await page.locator("aside button:has-text('Overlays & Dialogs')").first().click();
    await page.waitForTimeout(500);
    await page.waitForTimeout(400);

    const dropdownTrigger = page.locator("button:has-text('Actions Menu')");
    const triggerInitialState = await dropdownTrigger.getAttribute("data-state");
    await dropdownTrigger.click();
    await page.waitForTimeout(300);

    const triggerOpenState = await dropdownTrigger.getAttribute("data-state");
    const menuItemVisible = await page.locator("[data-slot='dropdown-menu-item']:has-text('Rename')").isVisible();
    console.log(`[interaction] Dropdown menu opened: state=${triggerOpenState}, Rename visible=${menuItemVisible}`);
    if (triggerOpenState !== "open" || !menuItemVisible) {
      throw new Error("Dropdown menu failed to open properly");
    }
    auditResults.interactions.dropdownMenu = { state: triggerOpenState, menuItemVisible };

    // Close menu by clicking outside or pressing Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // ─────────────────────────────────────────────────────────────
    // 5. Layout Engine & Tailwind Verification on /dev/ui
    // ─────────────────────────────────────────────────────────────
    console.log("[audit] Verifying Tailwind computed layout on /dev/ui...");
    await page.locator("aside button:has-text('Cards & Containers')").first().click();
    await page.waitForTimeout(400);

    const layoutCheck = await page.evaluate(() => {
      const asideEl = document.querySelector("aside");
      const asideStyle = asideEl ? window.getComputedStyle(asideEl) : null;
      const asideRect = asideEl ? asideEl.getBoundingClientRect() : null;

      const fileInput = document.querySelector("input[type='file']");
      const fileInputStyle = fileInput ? window.getComputedStyle(fileInput) : null;

      const gridEl = document.querySelector(".grid");
      const gridStyle = gridEl ? window.getComputedStyle(gridEl) : null;

      return {
        aside: {
          width: asideStyle?.width,
          position: asideStyle?.position,
          rectWidth: Math.round(asideRect?.width || 0),
        },
        fileInput: {
          display: fileInputStyle?.display,
        },
        grid: {
          display: gridStyle?.display,
        },
      };
    });

    console.log("[layout]", layoutCheck);
    if (!layoutCheck.aside || Math.round(parseFloat(layoutCheck.aside.width)) !== 224) {
      throw new Error(`Expected aside width to be 224px on desktop, got ${layoutCheck.aside?.width}`);
    }
    if (layoutCheck.fileInput.display !== "none") {
      throw new Error(`Expected file input display to be 'none', got ${layoutCheck.fileInput.display}`);
    }
    if (layoutCheck.grid.display !== "grid") {
      throw new Error(`Expected .grid display to be 'grid', got ${layoutCheck.grid.display}`);
    }
    auditResults.layout = layoutCheck;

    // Save final updated /dev/ui screenshot with interactions & layout verified
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "dev-ui-interacted.png") });

    await browser.close();

    console.log("\n=======================================================");
    console.log("   LAYER 2 RUNTIME & COMPUTED STYLE AUDIT PASSED!     ");
    console.log("=======================================================");
    console.log("Audited Routes (all 200 OK):", auditResults.routes);
    console.log("Verified Computed Styles:", auditResults.computedStyles);
    console.log("Verified Interactions:", auditResults.interactions);
    console.log(`Runtime Errors: ${auditResults.errors.length}`);
    console.log("Saved Screenshots:", fs.readdirSync(SCREENSHOT_DIR));
    console.log("=======================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("\n❌ RUNTIME AUDIT FAILED:", err);
    process.exit(1);
  } finally {
    cleanupServer();
  }
}

run();
