import { test, expect } from "@playwright/test";

test("homepage renders core archive messaging", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /search quotes, transcripts, guests/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /episodes/i })).toBeVisible();
});

test("episode cards navigate to an episode detail page with playback controls", async ({ page }) => {
  await page.goto("/");
  const firstEpisodeCard = page.locator("article").filter({ has: page.locator('a[href^="/episode/"]') }).first();
  const firstEpisodeLink = firstEpisodeCard.locator('a[href^="/episode/"]').first();
  await expect(firstEpisodeLink).toBeVisible();
  const href = await firstEpisodeLink.getAttribute("href");
  expect(href).toMatch(/^\/episode\//);
  await page.goto(href!);

  await expect(page).toHaveURL(/\/episode\//);
  await expect(page.getByRole("link", { name: /public source/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /play episode/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /transcript/i })).toBeVisible();
});
