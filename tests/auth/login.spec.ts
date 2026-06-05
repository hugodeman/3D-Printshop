import { test, expect } from "@playwright/test"

// Gedeelde testgebruiker — aangemaakt via de UI in de before hook
const TEST_EMAIL = "hugob2004@outlook.com"
const TEST_PASSWORD = "testtest"

test.describe.configure({ mode: "serial" }) // ← tests na elkaar, niet parallel

// test.beforeAll(async ({ browser }) => {
//     // Eenmalig registreren zodat de gebruiker bestaat voor de login tests
//     const page = await browser.newPage()
//     await page.goto('/auth/register')
//
//     await page.fill('[placeholder="Email"]', TEST_EMAIL)
//     await page.fill('[placeholder="Herhaal Email"]', TEST_EMAIL)
//     await page.fill('[placeholder="Wachtwoord"]', TEST_PASSWORD)
//     await page.fill('[placeholder="Herhaal Wachtwoord"]', TEST_PASSWORD)
//     await page.click('text=Account aanmaken')
//
//     await page.waitForURL('/', { timeout: 10000 })
//     await page.close()
// })

test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
})

test.describe("Login", () => {
    test("logt in met geldige gegevens en redirectt naar /", async ({ page }) => {
        const form = page.locator("form")

        await page.goto("/auth/login")

        await page.fill("[placeholder=\"Email\"]", TEST_EMAIL)
        await page.fill("[placeholder=\"Wachtwoord\"]", TEST_PASSWORD)

        await Promise.all([
            page.waitForURL("/"),
            form.getByRole("button", { name: "Login" }).click(),
        ])

        await expect(page).toHaveURL("/")
    })

    test("toont foutmelding bij verkeerd wachtwoord", async ({ page }) => {
        await page.goto("/auth/login")

        const form = page.locator("form")

        await form.getByPlaceholder("Email").fill(TEST_EMAIL)
        await form.getByPlaceholder("Wachtwoord").fill("foutWachtwoord")

        await form.getByRole("button", { name: "Login" }).click()

        await expect(
            page.getByText(/ongeldig/i).first()
        ).toBeVisible()
    })

    test("redirectt naar de juiste pagina na login via redirect param", async ({ page }) => {
        const form = page.locator("form")

        await page.goto("/auth/login?redirect=/builder")

        await page.fill("[placeholder=\"Email\"]", TEST_EMAIL)
        await page.fill("[placeholder=\"Wachtwoord\"]", TEST_PASSWORD)

        await Promise.all([
            page.waitForURL("/builder"),
            form.getByRole("button", { name: "Login" }).click(),
        ])

        await expect(page).toHaveURL("/builder", { timeout: 10000 })
    })
})