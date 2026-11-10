import { open, test } from "nsh/test";

test("preview settings", async () => {
  const app = await open("./App.tsx", { platform: "macos", width: 1100, height: 820 });
  await app.press("Настройки");
  await app.waitUntil(() => false, { timeout: 45000 }).catch(() => {});
});
