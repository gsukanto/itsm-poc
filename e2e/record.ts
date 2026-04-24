/**
 * Records one .webm walkthrough per ITSM module.
 *
 * Prereqs:
 *   - API running on http://localhost:3000
 *   - Web running on http://localhost:5173
 *   - A dev JWT at /tmp/dev.jwt (HS256, signed with JWT_DEV_SECRET)
 *
 * Output: e2e/videos/<module>.webm
 */
import { chromium, type Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const WEB = process.env.WEB_URL || 'http://localhost:5173';
const JWT_PATH = process.env.JWT_PATH || '/tmp/dev.jwt';
const OUT_DIR = path.resolve(__dirname, 'videos');

type Tour = {
  name: string;
  title: string;
  steps: (page: Page) => Promise<void>;
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function visitList(page: Page, listPath: string) {
  await page.goto(`${WEB}${listPath}`, { waitUntil: 'networkidle' });
  await wait(1500);
}

async function clickFirstRow(page: Page) {
  // ListGrid wraps the first cell in a router Link; CardActionArea-based lists use links too.
  const link = page.locator('a[href*="/"]').filter({ hasNot: page.locator('nav a') }).first();
  try {
    await link.waitFor({ state: 'visible', timeout: 5000 });
    await link.click();
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await wait(2000);
    await page.goBack({ waitUntil: 'networkidle' }).catch(() => {});
    await wait(800);
  } catch {
    /* some lists may have no rows; just continue */
  }
}

async function scrollGrid(page: Page) {
  await page.mouse.wheel(0, 400);
  await wait(700);
  await page.mouse.wheel(0, 400);
  await wait(700);
  await page.mouse.wheel(0, -800);
  await wait(500);
}

const simpleTour = (name: string, title: string, listPath: string): Tour => ({
  name,
  title,
  async steps(page) {
    await visitList(page, listPath);
    await scrollGrid(page);
    await clickFirstRow(page);
  },
});

const tours: Tour[] = [
  {
    name: 'dashboard',
    title: 'Dashboard',
    async steps(page) {
      await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });
      await wait(3500);
      await scrollGrid(page);
    },
  },
  simpleTour('incidents', 'Incident Management', '/incidents'),
  simpleTour('service-requests', 'Service Requests', '/service-requests'),
  {
    name: 'catalog',
    title: 'Service Catalog',
    async steps(page) {
      await visitList(page, '/catalog');
      await scrollGrid(page);
      const card = page.locator('a[href*="/catalog/"]').first();
      try {
        await card.waitFor({ state: 'visible', timeout: 5000 });
        await card.click();
        await wait(2500);
        await page.goBack({ waitUntil: 'networkidle' });
        await wait(800);
      } catch {}
    },
  },
  simpleTour('problems', 'Problem Management', '/problems'),
  {
    name: 'changes',
    title: 'Change Enablement',
    async steps(page) {
      await visitList(page, '/changes');
      await scrollGrid(page);
      await clickFirstRow(page);
      await page.goto(`${WEB}/changes/calendar`, { waitUntil: 'networkidle' });
      await wait(2500);
    },
  },
  simpleTour('cmdb', 'CMDB', '/cmdb'),
  simpleTour('knowledge', 'Knowledge', '/knowledge'),
  simpleTour('slm', 'Service Level Management', '/slm'),
  simpleTour('events', 'Event Management', '/events'),
  simpleTour('availability', 'Availability', '/availability'),
  simpleTour('capacity', 'Capacity', '/capacity'),
  simpleTour('releases', 'Release & Deployment', '/releases'),
  simpleTour('assets', 'Asset Management', '/assets'),
  simpleTour('continuity', 'Service Continuity', '/continuity'),
  simpleTour('suppliers', 'Supplier Management', '/suppliers'),
  {
    name: 'financial',
    title: 'Service Financial',
    async steps(page) {
      await visitList(page, '/financial');
      await scrollGrid(page);
    },
  },
  {
    name: 'approvals',
    title: 'Approvals',
    async steps(page) {
      await visitList(page, '/approvals');
      await scrollGrid(page);
    },
  },
];

async function main() {
  if (!fs.existsSync(JWT_PATH)) {
    console.error(`Dev JWT not found at ${JWT_PATH}. Mint one and try again.`);
    process.exit(1);
  }
  const jwt = fs.readFileSync(JWT_PATH, 'utf8').trim();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  for (const tour of tours) {
    const outFile = path.join(OUT_DIR, `${tour.name}.webm`);
    console.log(`▶ Recording ${tour.name}...`);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      recordVideo: { dir: OUT_DIR, size: { width: 1440, height: 900 } },
    });
    // Pre-seed dev JWT so the SPA finds it on first render.
    await context.addInitScript((token: string) => {
      try {
        // @ts-ignore - this runs in the browser
        window.localStorage.setItem('dev_jwt', token);
      } catch {}
    }, jwt);

    const page = await context.newPage();
    page.on('pageerror', (e) => console.warn(`  [pageerror] ${e.message}`));
    try {
      await tour.steps(page);
    } catch (err: any) {
      console.warn(`  ⚠ ${tour.name}: ${err?.message || err}`);
    }

    const video = page.video();
    await context.close();
    if (video) {
      const tmp = await video.path();
      fs.copyFileSync(tmp, outFile);
      try { fs.unlinkSync(tmp); } catch {}
    }
    console.log(`  ✓ ${outFile}`);
  }

  await browser.close();
  console.log('\nDone. Videos in', OUT_DIR);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
