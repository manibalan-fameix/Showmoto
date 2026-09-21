import { expect, test } from "@playwright/test"

import { pickVariantAndContinue, signIn, startCar } from "./helpers"

test("live camera: outline overlay, shutter captures, next angle, upload lands", async ({ page }) => {
  await signIn(page)
  await startCar(page, "TN 12 JK 3456")
  await pickVariantAndContinue(page)

  await page.getByRole("button", { name: /start guided capture/i }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog.locator("video")).toBeVisible()
  await expect(dialog.locator('svg[viewBox="0 0 240 160"]')).toBeVisible() // the angle outline
  await expect(dialog).toContainText("Front ¾")
  await expect(dialog).toContainText("1 of 12")

  await dialog.getByRole("button", { name: "Take photo" }).click()
  await expect(dialog).toContainText("Rear ¾")
  await expect(dialog).toContainText("2 of 12")

  await dialog.getByRole("button", { name: /^skip$/i }).click()
  await expect(dialog).toContainText("Left side")

  await dialog.getByRole("button", { name: /^done$/i }).click()
  await expect(page.getByTestId("upload-count")).toHaveText("1 of 12 uploaded", { timeout: 60_000 })
  await expect(page.locator('[data-angle="front_three_quarter"]')).toHaveAttribute("data-state", "done")
})
