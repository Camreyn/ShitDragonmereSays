import { test, expect } from "@playwright/test";

test("homepage renders core archive messaging", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /search quotes, transcripts, guests/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /episodes/i })).toBeVisible();
});
