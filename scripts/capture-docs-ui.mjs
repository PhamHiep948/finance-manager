import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { chromium } from "../src/frontend/node_modules/playwright-core/index.mjs";

const BASE = "http://localhost:5173";
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "scripts", ".shot-tmp");
const DOCS = path.join(ROOT, "docs", "images");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const USERS = {
  admin: { id: 1, name: "Admin", email: "admin@demo.local", role: "ADMIN", status: "active", phone: "090 123 4567", avatar: "https://i.pravatar.cc/64?img=33", lastActive: "Vừa xong" },
  owner: { id: 2, name: "Chủ shop", email: "owner@demo.local", role: "SHOP_OWNER", status: "active", phone: "090 222 3333", avatar: "https://i.pravatar.cc/64?img=12", lastActive: "Vừa xong" },
  staff: { id: 3, name: "Nhân viên", email: "staff@demo.local", role: "EMPLOYEE", status: "active", phone: "090 333 4444", avatar: "https://i.pravatar.cc/64?img=11", lastActive: "Vừa xong" },
  viewer: { id: 4, name: "Người xem", email: "viewer@demo.local", role: "VIEWER", status: "active", phone: "090 555 6666", avatar: "https://i.pravatar.cc/64?img=5", lastActive: "Vừa xong" },
};

async function settle(page, ms = 500) {
  await page.waitForTimeout(ms);
  await page.evaluate(async () => {
    document.querySelectorAll("canvas").forEach((c) => c.dispatchEvent(new Event("resize")));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}

async function loginAs(page, user) {
  await page.goto(`${BASE}/#/login`, { waitUntil: "networkidle" });
  await page.evaluate((user) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("fm_user", JSON.stringify(user));
    localStorage.setItem("fm_theme", "light");
    document.documentElement.dataset.theme = "light";
  }, user);
  await page.reload({ waitUntil: "networkidle" });
  await page.goto(`${BASE}/#/dashboard`, { waitUntil: "networkidle" });
  await page.waitForSelector(".sidebar-new, .sidebar", { timeout: 15000 });
  await page.evaluate(() => {
    localStorage.setItem("fm_theme", "light");
    document.documentElement.dataset.theme = "light";
  });
  await settle(page, 500);
}

async function shot(page, file) {
  await page.evaluate(() => {
    localStorage.setItem("fm_theme", "light");
    document.documentElement.dataset.theme = "light";
    window.scrollTo(0, 0);
  });
  await settle(page, 450);
  await page.screenshot({ path: file, fullPage: false, animations: "disabled" });
}

async function captureRole(page, folder, user, opts) {
  const dir = path.join(OUT, folder);
  await mkdir(dir, { recursive: true });
  await loginAs(page, user);

  await page.goto(`${BASE}/#/dashboard`, { waitUntil: "networkidle" });
  await page.waitForSelector("canvas");
  await shot(page, path.join(dir, "01-dashboard.png"));

  await page.goto(`${BASE}/#/incomes`, { waitUntil: "networkidle" });
  await page.waitForSelector(".data-table");
  await shot(page, path.join(dir, "02-khoan-thu.png"));

  if (opts.incomeWrite) {
    await page.goto(`${BASE}/#/incomes?new=1`, { waitUntil: "networkidle" });
    await page.waitForSelector(".record-form-window");
    await shot(page, path.join(dir, "02b-them-khoan-thu.png"));
    await page.goto(`${BASE}/#/incomes?edit=12`, { waitUntil: "networkidle" });
    await page.waitForSelector(".record-form-window");
    await shot(page, path.join(dir, "02c-sua-khoan-thu.png"));
  }

  await page.goto(`${BASE}/#/incomes`, { waitUntil: "networkidle" });
  await page.locator("tbody tr.clickable").first().click();
  await page.waitForSelector(".exp-modal");
  await shot(page, path.join(dir, "02d-chi-tiet-khoan-thu.png"));

  await page.goto(`${BASE}/#/expenses`, { waitUntil: "networkidle" });
  await page.waitForSelector(".data-table");
  await shot(page, path.join(dir, "03-khoan-chi.png"));

  if (opts.expenseWrite) {
    await page.goto(`${BASE}/#/expenses?new=1`, { waitUntil: "networkidle" });
    await page.waitForSelector(".record-form-window");
    await shot(page, path.join(dir, "03b-them-khoan-chi.png"));
    await page.goto(`${BASE}/#/expenses?edit=1`, { waitUntil: "networkidle" });
    await page.waitForSelector(".record-form-window");
    await shot(page, path.join(dir, "03c-sua-khoan-chi.png"));
  }

  await page.goto(`${BASE}/#/expenses`, { waitUntil: "networkidle" });
  await page.locator("tbody tr.clickable").first().click();
  await page.waitForSelector(".exp-modal");
  await shot(page, path.join(dir, "03d-chi-tiet-khoan-chi.png"));

  if (opts.reports) {
    await page.goto(`${BASE}/#/reports`, { waitUntil: "networkidle" });
    await page.waitForSelector(".underline-tabs");
    await page.waitForSelector("canvas");
    await shot(page, path.join(dir, "04-bao-cao.png"));
  }

  if (opts.import) {
    await page.goto(`${BASE}/#/import`, { waitUntil: "networkidle" });
    await page.waitForSelector(".import-tabs-bar, .seg-tabs");
    await shot(page, path.join(dir, opts.importFile || "05-import.png"));
  }

  if (opts.audit) {
    await page.goto(`${BASE}/#/audit`, { waitUntil: "networkidle" });
    await page.waitForSelector(".audit-table");
    await shot(page, path.join(dir, "06-nhat-ky.png"));
  }

  if (opts.users) {
    await page.goto(`${BASE}/#/users`, { waitUntil: "networkidle" });
    await page.waitForSelector(".users-table");
    await shot(page, path.join(dir, "07-nguoi-dung.png"));
    await page.getByRole("button", { name: "Thêm người dùng" }).click();
    await page.waitForSelector(".user-window");
    await shot(page, path.join(dir, "07b-them-nguoi-dung.png"));
    await page.locator(".user-window .icon-ghost").click();
    await page.locator('button[title="Sửa"]').first().click();
    await page.waitForSelector(".user-window");
    await shot(page, path.join(dir, "07c-sua-nguoi-dung.png"));
  }

  await page.goto(`${BASE}/#/profile`, { waitUntil: "networkidle" });
  await page.waitForSelector(".profile-tabs-bar, .profile-tabs");
  await shot(page, path.join(dir, opts.profileFile + ".png"));
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  // Xóa ảnh login
  await rm(path.join(DOCS, "chung", "01-dang-nhap.png"), { force: true });

  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--hide-scrollbars"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  // Không chụp login / dark mode — chỉ light mode
  await captureRole(page, "admin", USERS.admin, {
    incomeWrite: true,
    expenseWrite: true,
    reports: true,
    import: true,
    audit: true,
    users: true,
    profileFile: "08-ho-so",
  });
  await captureRole(page, "chu-shop", USERS.owner, {
    incomeWrite: true,
    expenseWrite: true,
    reports: true,
    import: true,
    audit: true,
    users: false,
    profileFile: "07-ho-so",
  });
  await captureRole(page, "nhan-vien", USERS.staff, {
    incomeWrite: true,
    expenseWrite: true,
    reports: false,
    import: true,
    importFile: "04-import.png",
    audit: false,
    users: false,
    profileFile: "05-ho-so",
  });
  await captureRole(page, "nguoi-xem", USERS.viewer, {
    incomeWrite: false,
    expenseWrite: false,
    reports: true,
    import: false,
    audit: false,
    users: false,
    profileFile: "05-ho-so",
  });

  await browser.close();

  for (const folder of ["admin", "chu-shop", "nhan-vien", "nguoi-xem"]) {
    const src = path.join(OUT, folder);
    const dst = path.join(DOCS, folder);
    await mkdir(dst, { recursive: true });
    for (const name of await readdir(src)) {
      if (!name.endsWith(".png")) continue;
      await cp(path.join(src, name), path.join(dst, name));
    }
  }

  // Dọn file thừa
  await rm(path.join(DOCS, "nhan-vien", "05-import.png"), { force: true });
  await rm(path.join(DOCS, "chung", "01-dang-nhap.png"), { force: true });

  console.log("updated", DOCS, "(no login, light mode only)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
