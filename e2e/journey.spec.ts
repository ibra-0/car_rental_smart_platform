import { test, expect } from "@playwright/test";
test("complete customer journey and admin operations", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push(message.text() + " " + message.location().url);
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A better way to drive." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Find a car", exact: true }).click();
  await expect(page).toHaveURL(/\/cars\?/);
  await page
    .getByRole("combobox", { name: "Brand", exact: true })
    .selectOption("Toyota");
  await expect(page.locator(".car-card")).toHaveCount(3);
  await page
    .getByRole("combobox", { name: "Vehicle class", exact: true })
    .selectOption("Comfort");
  await expect(page.locator(".car-card")).toHaveCount(1);
  await page.getByRole("link", { name: "View details", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Toyota Camry", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".price-total")).toContainText("75,000");
  await page.getByRole("link", { name: "Book this car" }).click();
  await page.getByLabel("Full name", { exact: true }).fill("Demo Customer");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("demo@example.com");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Confirm demo booking" }).click();
  await expect(
    page.getByRole("heading", { name: "You’re on your way." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "View my bookings" }).click();
  await expect(page.locator(".booking-card")).toHaveCount(1);
  await page.goto("/cars/1");
  await expect(
    page.getByRole("button", { name: "Currently unavailable" }),
  ).toBeDisabled();
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Cancel reservation" }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.locator(".booking-card .status")).toHaveText("Cancelled");
  await page.goto("/recommendations");
  await page.getByRole("button", { name: "Find my matches" }).click();
  await expect(page.locator(".recommendation-card").first()).toBeVisible();
  await page.goto("/admin");
  await page.getByRole("button", { name: "Add vehicle", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Brand", { exact: true })
    .fill("Demo");
  await page
    .getByRole("dialog")
    .getByLabel("Model", { exact: true })
    .fill("Tourer");
  await page.getByRole("button", { name: "Save vehicle" }).click();
  await expect(page.getByText("Demo Tourer", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Edit Demo Tourer", exact: true })
    .click();
  await page.getByRole("dialog").getByLabel("Daily price (₸)").fill("29000");
  await page.getByRole("button", { name: "Save vehicle" }).click();
  await expect(
    page.locator("tr").filter({ hasText: "Demo Tourer" }),
  ).toContainText("29,000");
  await page
    .getByRole("button", { name: "Toggle Demo Tourer availability" })
    .click();
  await expect(
    page.locator("tr").filter({ hasText: "Demo Tourer" }),
  ).toContainText("Reserved");
  await page
    .getByRole("button", { name: "Delete Demo Tourer", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByText("Demo Tourer", { exact: true })).toHaveCount(0);
  await page.goto("/booking/1");
  await page.getByLabel("Full name", { exact: true }).fill("Demo Customer");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("demo@example.com");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Confirm demo booking" }).click();
  await expect(
    page.getByRole("heading", { name: "You’re on your way." }),
  ).toBeVisible();
  await page.goto("/admin");
  await page.getByRole("button", { name: "Bookings", exact: true }).click();
  const upcoming = page.locator("tr").filter({
    has: page.locator("select option:checked", { hasText: "Upcoming" }),
  });
  await upcoming.getByRole("combobox").selectOption("Active");
  const active = page.locator("tr").filter({
    has: page.locator("select option:checked", { hasText: "Active" }),
  });
  await active.getByRole("combobox").selectOption("Completed");
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(page.locator(".booking-card .completed")).toHaveText(
    "Completed",
  );
  const stored = await page.evaluate(() => JSON.stringify(localStorage));
  expect(stored).not.toContain("demo@example.com");
  expect(stored).not.toContain("Demo Customer");
  expect(errors).toEqual([]);
});
test("responsive pages have no overflow or broken images", async ({ page }) => {
  test.setTimeout(120000);
  for (const width of [375, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "/",
      "/cars",
      "/cars/1",
      "/booking/1",
      "/login",
      "/register",
      "/dashboard",
      "/recommendations",
      "/admin",
    ]) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      await page.locator("img").evaluateAll((imgs) =>
        Promise.all(
          imgs.map((i) => {
            (i as HTMLImageElement).loading = "eager";
            return (i as HTMLImageElement).decode().catch(() => {});
          }),
        ),
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${route} at ${width}px`,
      ).toBe(true);
      expect(
        await page
          .locator("img")
          .evaluateAll((imgs) =>
            imgs.every((i) => (i as HTMLImageElement).naturalWidth > 0),
          ),
        `images at ${route}`,
      ).toBe(true);
    }
  }
});
test("invalid routes, empty filters, auth and unavailable booking", async ({
  page,
}) => {
  await page.goto("/cars/not-a-car");
  await expect(
    page.getByRole("heading", { name: "This road doesn’t lead anywhere." }),
  ).toBeVisible();
  await page.goto("/cars");
  await page.getByLabel("Search vehicles").fill("does-not-exist");
  await expect(
    page.getByRole("heading", { name: "No cars found" }),
  ).toBeVisible();
  await page.goto("/cars/8");
  await expect(
    page.getByRole("button", { name: "Currently unavailable" }),
  ).toBeDisabled();
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as demo driver" }).click();
  await expect(
    page.getByRole("heading", { name: "Good to see you, Demo." }),
  ).toBeVisible();
});

test("mobile navigation, filters and monthly pricing", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Explore cars" })
    .click();
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Vehicle class", exact: true })
    .selectOption("Premium");
  await expect(page.locator(".car-card")).toHaveCount(3);
  await page.getByRole("button", { name: "Close filters" }).click();
  await page.goto("/cars/1?start=2099-01-01T10:00&end=2099-01-31T10:00");
  await expect(page.locator(".price-total")).toContainText("600,000");
  await expect(page.locator(".price-summary")).toContainText("150,000");
  await page.getByLabel("Return date and time").fill("2098-12-31T10:00");
  await expect(
    page.getByRole("button", { name: "Currently unavailable" }),
  ).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText(
    "Return must be after pickup",
  );
});
