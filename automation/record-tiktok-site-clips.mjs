import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, rmSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { chromium } from "playwright-core";

const root = resolve("site");
const outDir = resolve("exports/bol-tiktok-clips");
const videoTmp = resolve("exports/.clip-recordings");
const chromiumPath = process.env.CHROMIUM_PATH || "/home/logan1534/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome";
const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".csv": "text/csv; charset=utf-8"
};

function startServer() {
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const safePath = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = resolve(root, `.${safePath}`);
    if (!file.startsWith(root) || !existsSync(file)) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "content-type": mime[extname(file)] || "application/octet-stream" });
    createReadStream(file).pipe(res);
  });

  return new Promise((resolveServer) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolveServer({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

async function prepPage(page) {
  await page.addStyleTag({
    content: `
      html { scroll-behavior: smooth !important; }
      body { cursor: none !important; }
      .tap-dot {
        position: fixed;
        z-index: 99999;
        width: 40px;
        height: 40px;
        margin: -20px 0 0 -20px;
        border: 3px solid rgba(255,255,255,.95);
        border-radius: 999px;
        background: rgba(250, 204, 21, .55);
        box-shadow: 0 0 0 8px rgba(250, 204, 21, .22);
        pointer-events: none;
        transform: scale(.5);
        opacity: 0;
        transition: transform .22s ease, opacity .22s ease;
      }
      .tap-dot.on { transform: scale(1); opacity: 1; }
    `
  });
  await page.evaluate(() => {
    window.__tapDot = document.createElement("div");
    window.__tapDot.className = "tap-dot";
    document.body.appendChild(window.__tapDot);
  });
}

async function tap(page, selector) {
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`Missing selector: ${selector}`);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.evaluate(([dotX, dotY]) => {
    const dot = window.__tapDot;
    dot.style.left = `${dotX}px`;
    dot.style.top = `${dotY}px`;
    dot.classList.add("on");
  }, [x, y]);
  await page.mouse.click(x, y);
  await sleep(420);
  await page.evaluate(() => window.__tapDot?.classList.remove("on"));
}

async function recordClip(browser, name, baseUrl, action) {
  const context = await browser.newContext({
    viewport: { width: 540, height: 960 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    recordVideo: { dir: videoTmp, size: { width: 540, height: 960 } }
  });
  const page = await context.newPage();
  await action(page, baseUrl);
  await context.close();

  const video = await page.video().path();
  const mp4 = join(outDir, `${name}.mp4`);
  const ff = spawnSync(ffmpegPath, [
    "-y",
    "-i", video,
    "-vf", "scale=1080:1920,setsar=1",
    "-an",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    mp4
  ], { stdio: "inherit" });
  if (ff.status !== 0) throw new Error(`ffmpeg failed for ${name}`);
  return mp4;
}

async function main() {
  rmSync(videoTmp, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  mkdirSync(videoTmp, { recursive: true });

  const { server, baseUrl } = await startServer();
  const browser = await chromium.launch({
    executablePath: existsSync(chromiumPath) ? chromiumPath : "/usr/bin/chromium-browser",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"]
  });

  try {
    const clips = [];

    clips.push(await recordClip(browser, "01-home-to-calculator", baseUrl, async (page, url) => {
      await page.goto(`${url}/index.html`, { waitUntil: "networkidle" });
      await prepPage(page);
      await sleep(600);
      await page.locator("a.button.primary[href='#calculator']").scrollIntoViewIfNeeded();
      await tap(page, "a.button.primary[href='#calculator']");
      await sleep(1050);
      await page.locator("#calculator").scrollIntoViewIfNeeded();
      await sleep(1850);
    }));

    clips.push(await recordClip(browser, "02-bitaxe-gamma-odds", baseUrl, async (page, url) => {
      await page.goto(`${url}/index.html#calculator`, { waitUntil: "networkidle" });
      await prepPage(page);
      await page.locator(".tool-panel").scrollIntoViewIfNeeded();
      await sleep(650);
      await tap(page, "button[data-preset='1.2']");
      await sleep(900);
      await tap(page, "button[data-preset='1.8']");
      await sleep(1500);
      await page.locator(".results").scrollIntoViewIfNeeded();
      await sleep(650);
    }));

    clips.push(await recordClip(browser, "03-shareable-result", baseUrl, async (page, url) => {
      await page.goto(`${url}/index.html#calculator`, { waitUntil: "networkidle" });
      await prepPage(page);
      await tap(page, "button[data-preset='1.2']");
      await page.locator(".share-panel").scrollIntoViewIfNeeded();
      await sleep(850);
      await tap(page, "#copy-share");
      await sleep(1900);
    }));

    clips.push(await recordClip(browser, "04-weekend-challenge-copy", baseUrl, async (page, url) => {
      await page.goto(`${url}/weekend-mining-challenge.html`, { waitUntil: "networkidle" });
      await prepPage(page);
      await sleep(550);
      await page.locator(".copy-stack").scrollIntoViewIfNeeded();
      await sleep(850);
      await tap(page, ".copy-card:nth-of-type(4) .copy-snippet");
      await sleep(1800);
    }));

    console.log(JSON.stringify({ outDir, clips }, null, 2));
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
