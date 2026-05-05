import { chromium, type Locator, type Page } from "playwright";
import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

type DemoEnv = {
  appUrl: string;
  apiUrl: string;
  userName: string;
  userEmail: string;
  userPassword: string;
};

const rootDir = process.cwd();
const demoDir = path.join(rootDir, "demo");
const envPath = path.join(rootDir, ".env.demo");
const videoDir = path.join(demoDir, "videos");
const tempVideoDir = path.join(videoDir, ".tmp");
const outputVideo = path.join(videoDir, "todotree-demo.webm");

function loadDotEnvDemo() {
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf-8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] ??= value;
  }
}

function getDemoEnv(): DemoEnv {
  loadDotEnvDemo();

  return {
    appUrl: process.env.DEMO_APP_URL ?? "http://localhost:5173",
    apiUrl: process.env.DEMO_API_URL ?? "http://localhost:8000",
    userName: process.env.DEMO_USER_NAME ?? "Demo User",
    userEmail: process.env.DEMO_USER_EMAIL ?? "demo@example.com",
    userPassword: process.env.DEMO_USER_PASSWORD ?? "demo1234",
  };
}

async function ensureDemoUser(env: DemoEnv) {
  const response = await fetch(`${env.apiUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: env.userName,
      email: env.userEmail,
      password: env.userPassword,
    }),
  });

  if (response.ok || response.status === 409) return;

  const detail = await response.text();
  throw new Error(`Failed to prepare demo user: ${response.status} ${detail}`);
}

async function pause(page: Page, ms = 900) {
  await page.waitForTimeout(ms);
}

async function addDemoOverlay(page: Page) {
  await page.addStyleTag({
    content: `
      #demo-cursor {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 2147483647;
        width: 22px;
        height: 22px;
        border: 2px solid rgba(0, 0, 0, 0.82);
        border-radius: 9999px;
        background: rgba(255, 255, 255, 0.9);
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.75);
        pointer-events: none;
        transform: translate3d(36px, 36px, 0);
        transition: transform 460ms cubic-bezier(0.22, 1, 0.36, 1), scale 160ms ease;
      }

      #demo-cursor.demo-click {
        scale: 0.78;
      }

      #demo-cursor.demo-click::after {
        content: "";
        position: absolute;
        inset: -10px;
        border-radius: 9999px;
        border: 3px solid rgba(37, 99, 235, 0.62);
        animation: demo-ripple 520ms ease-out;
      }

      #demo-title-card {
        position: fixed;
        top: 44px;
        left: 50%;
        z-index: 2147483646;
        transform: translateX(-50%);
        border-radius: 14px;
        background: rgba(12, 18, 32, 0.9);
        color: white;
        padding: 16px 24px;
        box-shadow: 0 20px 48px rgba(0, 0, 0, 0.28);
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 22px;
        font-weight: 700;
        letter-spacing: 0;
        pointer-events: none;
        opacity: 0;
        transition: opacity 380ms ease, transform 380ms ease;
      }

      #demo-title-card.demo-visible {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }

      @keyframes demo-ripple {
        from { opacity: 0.85; transform: scale(0.6); }
        to { opacity: 0; transform: scale(2.35); }
      }
    `,
  });

  await page.evaluate(() => {
    if (!document.getElementById("demo-cursor")) {
      const cursor = document.createElement("div");
      cursor.id = "demo-cursor";
      document.body.appendChild(cursor);
    }

    if (!document.getElementById("demo-title-card")) {
      const title = document.createElement("div");
      title.id = "demo-title-card";
      title.textContent = "ToDoTree Demo";
      document.body.appendChild(title);
    }
  });
}

async function showIntro(page: Page) {
  await page.evaluate(() => {
    document.getElementById("demo-title-card")?.classList.add("demo-visible");
  });
  await pause(page, 2000);
  await page.evaluate(() => {
    document.getElementById("demo-title-card")?.classList.remove("demo-visible");
  });
  await pause(page, 450);
}

async function moveCursorTo(page: Page, locator: Locator, duration = 520) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error("Cannot move cursor: target element is not visible.");

  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.evaluate(
    ({ x: targetX, y: targetY, transitionMs }) => {
      const cursor = document.getElementById("demo-cursor");
      if (!cursor) return;
      cursor.style.transitionDuration = `${transitionMs}ms, 160ms`;
      cursor.style.transform = `translate3d(${targetX - 11}px, ${targetY - 11}px, 0)`;
    },
    { x, y, transitionMs: duration },
  );
  await page.mouse.move(x, y, { steps: 18 });
  await pause(page, duration + 120);
}

async function clickWithCursor(page: Page, locator: Locator) {
  await moveCursorTo(page, locator);
  await pause(page, 250);
  await page.evaluate(() => {
    const cursor = document.getElementById("demo-cursor");
    if (!cursor) return;
    cursor.classList.remove("demo-click");
    void cursor.offsetWidth;
    cursor.classList.add("demo-click");
  });
  await locator.click({ force: true });
  await pause(page, 520);
  await page.evaluate(() => {
    document.getElementById("demo-cursor")?.classList.remove("demo-click");
  });
}

async function typeLikeHuman(page: Page, locator: Locator, text: string) {
  await moveCursorTo(page, locator, 420);
  await locator.click();
  await pause(page, 250);
  await locator.pressSequentially(text, { delay: 42 });
  await pause(page, 520);
}

async function waitForPath(page: Page, predicate: (pathname: string) => boolean) {
  await page.waitForFunction(
    (predicateSource) => {
      const check = new Function("pathname", `return (${predicateSource})(pathname);`);
      return check(window.location.pathname);
    },
    predicate.toString(),
  );
}

async function copyLatestVideo() {
  const files = await readdir(tempVideoDir);
  const webm = files.find((file) => file.endsWith(".webm"));
  if (!webm) throw new Error("Playwright did not create a .webm video file.");

  await copyFile(path.join(tempVideoDir, webm), outputVideo);
}

async function main() {
  const env = getDemoEnv();
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
  const projectName = process.env.DEMO_PROJECT_NAME ?? `ToDoTree Demo ${timestamp}`;
  const taskTitle = process.env.DEMO_TASK_TITLE ?? "デプロイ前チェックを完了する";

  await ensureDemoUser(env);
  await rm(tempVideoDir, { force: true, recursive: true });
  await mkdir(tempVideoDir, { recursive: true });
  await mkdir(videoDir, { recursive: true });

  const browser = await chromium.launch({ headless: false, slowMo: 250 });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    recordVideo: {
      dir: tempVideoDir,
      size: { width: 1440, height: 960 },
    },
  });
  const page = await context.newPage();

  try {
    await page.goto(`${env.appUrl}/login`, { waitUntil: "networkidle" });
    await addDemoOverlay(page);
    await showIntro(page);

    await typeLikeHuman(page, page.getByTestId("login-email"), env.userEmail);
    await typeLikeHuman(page, page.getByTestId("login-password"), env.userPassword);
    await clickWithCursor(page, page.getByTestId("login-submit"));
    await waitForPath(page, (pathname) => pathname === "/dashboard");
    await pause(page, 950);

    await page.goto(`${env.appUrl}/projects`, { waitUntil: "networkidle" });
    await addDemoOverlay(page);
    await pause(page, 1000);

    await clickWithCursor(page, page.getByTestId("new-project-button"));
    await typeLikeHuman(page, page.getByTestId("project-name-input"), projectName);
    await typeLikeHuman(page, page.getByTestId("project-description-input"), "Playwright で録画するデモ用プロジェクトです。");
    await clickWithCursor(page, page.getByTestId("project-create-submit"));
    await page.getByTestId("project-card").filter({ hasText: projectName }).waitFor();
    await pause(page, 900);

    await clickWithCursor(page, page.getByTestId("project-card").filter({ hasText: projectName }));
    await waitForPath(page, (pathname) => pathname.startsWith("/projects/"));
    await addDemoOverlay(page);
    await page.getByTestId("tree-view").waitFor();
    await pause(page, 1200);

    await clickWithCursor(page, page.getByTestId("task-panel-add-task"));
    await typeLikeHuman(page, page.getByTestId("task-title-input"), taskTitle);
    await typeLikeHuman(page, page.getByTestId("task-description-input"), "API、CI、README、migration の確認を含むデモタスクです。");
    await clickWithCursor(page, page.getByTestId("task-save-submit"));
    await page.getByTestId("tree-view").waitFor();
    await pause(page, 1200);

    await clickWithCursor(page, page.getByTestId("task-view-kanban"));
    await page.getByTestId("kanban-view").waitFor();
    await pause(page, 1200);

    const card = page.getByTestId("kanban-card").filter({ hasText: taskTitle });
    await moveCursorTo(page, card, 520);
    await pause(page, 350);
    await clickWithCursor(page, card.getByTestId("kanban-next-status"));
    await pause(page, 650);
    const progressedCard = page.getByTestId("kanban-card").filter({ hasText: taskTitle });
    await moveCursorTo(page, progressedCard, 520);
    await pause(page, 350);
    await clickWithCursor(page, progressedCard.getByTestId("kanban-next-status"));
    await pause(page, 1100);

    await clickWithCursor(page, page.getByTestId("task-view-tree"));
    await page.getByTestId("tree-view").waitFor();
    await pause(page, 2600);
  } finally {
    await context.close();
    await browser.close();
  }

  await copyLatestVideo();
  await rm(tempVideoDir, { force: true, recursive: true });
  console.log(`Demo video saved to ${path.relative(rootDir, outputVideo)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
