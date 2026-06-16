#!/usr/bin/env node

/**
 * fetch-page.js - Headless Chrome fallback for bot-protected pages
 *
 * Usage: node scripts/fetch-page.js <URL> [--selector <css>] [--timeout <ms>]
 *
 * Exit codes:
 *   0 = success
 *   1 = argument error
 *   2 = Chrome not found
 *   3 = page fetch error
 */

const puppeteer = require("puppeteer-core");
const TurndownService = require("turndown");

// --- CLI argument parsing ---

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = { url: null, selector: null, timeout: 30000 };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--selector" && i + 1 < args.length) {
      result.selector = args[++i];
    } else if (args[i] === "--timeout" && i + 1 < args.length) {
      result.timeout = parseInt(args[++i], 10);
    } else if (!args[i].startsWith("--") && !result.url) {
      result.url = args[i];
    }
  }

  return result;
}

// --- Chrome detection (cross-platform) ---

const fs = require("fs");
const path = require("path");

function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const candidates = [];

  if (process.platform === "win32") {
    candidates.push(
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
      "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
      path.join(
        process.env.LOCALAPPDATA || "",
        "Google/Chrome/Application/chrome.exe"
      )
    );
  } else if (process.platform === "darwin") {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      path.join(
        process.env.HOME || "",
        "Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      )
    );
  } else {
    // Linux
    candidates.push(
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/snap/bin/chromium"
    );
  }

  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }

  return null;
}

// --- Main ---

async function main() {
  const { url, selector, timeout } = parseArgs(process.argv);

  if (!url) {
    console.error(
      "Usage: node scripts/fetch-page.js <URL> [--selector <css>] [--timeout <ms>]"
    );
    process.exit(1);
  }

  const chromePath = findChrome();
  if (!chromePath) {
    console.error(
      "Error: Chrome not found. Set CHROME_PATH environment variable."
    );
    process.exit(2);
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-extensions",
      ],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "networkidle2", timeout });

    // Remove non-content elements
    await page.evaluate(() => {
      const selectors = [
        "script",
        "style",
        "noscript",
        "iframe",
        "nav",
        "footer",
        "aside",
        "header:not(article header)",
        "[role='navigation']",
        "[role='banner']",
        "[role='contentinfo']",
        ".cookie-banner",
        ".ad",
        ".advertisement",
        ".sidebar",
      ];
      for (const sel of selectors) {
        document.querySelectorAll(sel).forEach((el) => el.remove());
      }
    });

    let html;
    if (selector) {
      html = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return el ? el.innerHTML : null;
      }, selector);
      if (!html) {
        console.error(`Error: Selector "${selector}" not found on page.`);
        process.exit(3);
      }
    } else {
      html = await page.evaluate(() => document.body.innerHTML);
    }

    // Convert to Markdown
    const turndown = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });

    // Skip image tags to reduce noise
    turndown.addRule("skipImages", {
      filter: "img",
      replacement: () => "",
    });

    const markdown = turndown.turndown(html);
    console.log(markdown);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(3);
  } finally {
    if (browser) await browser.close();
  }
}

main();
