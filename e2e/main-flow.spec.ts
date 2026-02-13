import { test, expect } from "@playwright/test";

test.describe("Seattle Sports Intel - Main Flow", () => {
  test("loads home dashboard with articles and navigates to article", async ({
    page,
  }) => {
    // 1. Load home page
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Seattle Sports Intel");

    // Verify tabs exist
    await expect(page.getByText("All Seattle")).toBeVisible();
    await expect(page.getByText("Mariners")).toBeVisible();
    await expect(page.getByText("Seahawks")).toBeVisible();
    await expect(page.getByText("SuperSonics")).toBeVisible();

    // Verify some articles are present
    await expect(page.locator("text=Top Stories")).toBeVisible();
  });

  test("navigates to article and bookmarks it", async ({ page }) => {
    // 1. Go home
    await page.goto("/");

    // 2. Click first article link
    const firstArticle = page.locator('a[href^="/article/"]').first();
    await expect(firstArticle).toBeVisible();
    await firstArticle.click();

    // 3. Verify we're on article page
    await expect(page.locator("text=Read Original")).toBeVisible();
    await expect(page.locator("text=Attribution")).toBeVisible();

    // 4. Bookmark the article
    const bookmarkBtn = page.getByRole("button", { name: /bookmark/i });
    await expect(bookmarkBtn).toBeVisible();
    await bookmarkBtn.click();
    await expect(
      page.getByRole("button", { name: /bookmarked/i })
    ).toBeVisible();

    // 5. Navigate to bookmarks page
    await page.goto("/bookmarks");
    await expect(page.locator("h1")).toContainText("Bookmarks");

    // 6. Verify the bookmarked article appears
    await expect(page.locator("text=1 saved")).toBeVisible();
  });

  test("navigates to team pages", async ({ page }) => {
    // Check Mariners page
    await page.goto("/team/mariners");
    await expect(page.locator("h1")).toContainText("Seattle Mariners");

    // Check Seahawks page
    await page.goto("/team/seahawks");
    await expect(page.locator("h1")).toContainText("Seattle Seahawks");

    // Check SuperSonics page
    await page.goto("/team/supersonics");
    await expect(page.locator("h1")).toContainText("Seattle SuperSonics");
  });

  test("search page works", async ({ page }) => {
    await page.goto("/search");
    await expect(page.locator("h1")).toContainText("Search");

    // Type a search query
    const searchInput = page.getByPlaceholder("Search articles");
    await searchInput.fill("Julio");

    // Wait for results
    await page.waitForTimeout(500);
    await expect(page.locator("text=results")).toBeVisible();
  });

  test("digest page loads", async ({ page }) => {
    await page.goto("/digest");
    await expect(page.locator("h1")).toContainText("Daily Digest");
    await expect(page.locator("text=Seattle Mariners")).toBeVisible();
    await expect(page.locator("text=Seattle Seahawks")).toBeVisible();
    await expect(page.locator("text=Seattle SuperSonics")).toBeVisible();
  });

  test("admin page loads with source health", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("h1")).toContainText("Admin Dashboard");
    await expect(page.locator("text=Source Health")).toBeVisible();
  });
});
