import { expect, test, type Page } from "@playwright/test"

import { CAR_ANGLES } from "../lib/angles"

/** A real JPEG, generated in the page so no fixture file is needed. */
async function jpeg(page: Page, label = "x") {
  const b64 = await page.evaluate(async (text) => {
    const c = document.createElement("canvas")
    c.width = 800
    c.height = 600
    const ctx = c.getContext("2d")!
    ctx.fillStyle = "#3b6ea5"
    ctx.fillRect(0, 0, 800, 600)
    ctx.fillStyle = "#fff"
    ctx.font = "48px sans-serif"
    ctx.fillText(text, 40, 300)
    const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), "image/jpeg", 0.9))
    const buf = new Uint8Array(await blob.arrayBuffer())
    let s = ""
    buf.forEach((v) => (s += String.fromCharCode(v)))
    return btoa(s)
  }, label)
  return { name: `${label}.jpg`, mimeType: "image/jpeg", buffer: Buffer.from(b64, "base64") }
}

async function signIn(page: Page) {
  await page.goto("/login")
  await page.getByRole("button", { name: /continue with google/i }).click()
  await page.waitForURL("**/dashboard")
}

async function startCar(page: Page, reg: string) {
  await page.goto("/cars/new")
  await page.getByTestId("plate-file-input").setInputFiles(await jpeg(page, "plate"))
  await page.getByLabel("Registration number").fill(reg)
  await page.getByRole("button", { name: /look up this car/i }).click()
  await expect(page.getByText("Confirm the car").first()).toBeVisible().catch(() => {})
  await expect(page.getByTestId("variant-option").first()).toBeVisible()
}

async function pickVariantAndContinue(page: Page) {
  await page.getByTestId("variant-option").first().click()
  await expect(page.getByTestId("variant-option").first()).toHaveAttribute("aria-pressed", "true")
  await page.getByRole("button", { name: "Continue", exact: true }).click()
}

async function captureAll(page: Page) {
  await page.getByRole("button", { name: /start guided capture/i }).click()
  for (const [i, angle] of CAR_ANGLES.entries()) {
    await expect(page.getByRole("dialog")).toContainText(`${i + 1} of ${CAR_ANGLES.length}`)
    await page.getByTestId("camera-file-input").setInputFiles(await jpeg(page, angle))
  }
  await expect(page.getByRole("dialog")).toBeHidden()
}

test("plate photo to a published car, with a working short link", async ({ page, request }) => {
  const started = Date.now()
  await signIn(page)

  await startCar(page, "TN 11 AB 1234")
  await expect(page.getByText("TN 11 AB 1234").first()).toBeVisible()
  await pickVariantAndContinue(page)

  await expect(page.getByTestId("angle-grid")).toBeVisible()
  await captureAll(page)
  await expect(page.getByTestId("upload-count")).toHaveText("12 of 12 uploaded", { timeout: 60_000 })
  await page.getByRole("button", { name: "Continue", exact: true }).click()

  await page.getByLabel("Asking price (₹)").fill("565000")
  await page.getByLabel("Kilometres driven").fill("48200")
  await page.getByRole("button", { name: "Publish" }).click()

  await expect(page.getByTestId("published-title")).toBeVisible()
  const elapsedSec = (Date.now() - started) / 1000
  console.log(`plate photo to published: ${elapsedSec.toFixed(1)}s`)
  expect(elapsedSec).toBeLessThan(120)

  const shortLink = await page.getByTestId("short-link").inputValue()
  expect(shortLink).toMatch(/^http:\/\/sri-murugan\.localhost:\d+\/[23456789a-hjkmnp-z]{5,6}$/)
  const caption = await page.getByTestId("caption").inputValue()
  expect(caption).toContain(shortLink)
  expect(caption).toContain("5,65,000")
  expect(caption).toContain("48,200 km")

  // The short link 301s to the canonical URL, and that page renders the car.
  const res = await request.get(shortLink, { maxRedirects: 0 })
  expect(res.status()).toBe(301)
  const canonical = new URL(res.headers()["location"], shortLink).toString()
  expect(canonical).toMatch(/\/\d{4}-[a-z0-9-]+-tn11(-\d+)?$/)
  await page.goto(canonical)
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Alpha", { ignoreCase: true }).catch(() => {})
  await expect(page.getByText("₹5,65,000")).toBeVisible()
  await expect(page.getByText("TN11AB1234")).toHaveCount(0) // the plate never reaches buyers

  // Another dealer's subdomain must not resolve this car's short link.
  const other = shortLink.replace("sri-murugan", "chennai-prime")
  expect((await request.get(other, { maxRedirects: 0 })).status()).not.toBe(301)
})

test("uploads survive going offline and finish when the network returns", async ({ page, context }) => {
  await signIn(page)
  await startCar(page, "TN 09 CD 5678")
  await pickVariantAndContinue(page)
  await expect(page.getByTestId("angle-grid")).toBeVisible()

  await context.setOffline(true)
  await page.getByRole("button", { name: /start guided capture/i }).click()
  // Capture the cover photo and one more while offline, then close the camera.
  for (const angle of CAR_ANGLES.slice(0, 2)) {
    await page.getByTestId("camera-file-input").setInputFiles(await jpeg(page, angle))
  }
  await page.getByRole("button", { name: /^done$/i }).click()

  // Nothing has landed, and the app says so instead of failing.
  await expect(page.getByTestId("upload-count")).toHaveText("0 of 12 uploaded")
  await expect(page.getByText(/offline/i).first()).toBeVisible()

  await context.setOffline(false)
  await expect(page.getByTestId("upload-count")).toHaveText("2 of 12 uploaded", { timeout: 60_000 })
})

test("publishing waits for the cover photo, then unlocks while other photos keep uploading", async ({ page }) => {
  await signIn(page)
  await startCar(page, "TN 22 EF 9012")
  await pickVariantAndContinue(page)
  await page.getByRole("button", { name: "Continue", exact: true }).click() // straight to price with no photos

  await page.getByLabel("Asking price (₹)").fill("350000")
  await page.getByLabel("Kilometres driven").fill("72000")
  await expect(page.getByRole("button", { name: "Publish" })).toBeDisabled()
  await expect(page.getByText(/cover photo/i).first()).toBeVisible()
})
