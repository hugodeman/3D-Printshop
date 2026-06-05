import { test, expect } from "@playwright/test"

test.describe.configure({ mode: "serial" })

test.describe("Builder → Checkout flow", () => {

    test.beforeEach(async ({ page }) => {
        // Reset localStorage zodat de intro modal niet in de weg zit
        await page.goto("/builder")
        await page.evaluate(() => {
            localStorage.setItem("builder-intro-seen-v1", "1")
        })
        await page.reload()
    })

    test("intro modal toont bij eerste bezoek", async ({ page }) => {
        await page.evaluate(() => localStorage.clear())
        await page.reload()

        await expect(page.getByText("Start met bouwen")).toBeVisible()
        await page.click("text=Start met bouwen")
        await expect(page.getByText("Start met bouwen")).not.toBeVisible()
    })

    test("kan niet naar stap 2 zonder platform", async ({ page }) => {
        const naarDecoraties = page.getByText("Naar decoraties")
        await expect(naarDecoraties).toBeDisabled()
    })

    test("selecteert een platform en gaat naar stap 2", async ({ page }) => {
        // Klik op het Vierkant platform
        await page.getByText("Vierkant").click()

        // Knop is nu enabled
        await expect(page.getByText("Naar decoraties")).toBeEnabled()
        await page.getByText("Naar decoraties").click()

        // Stap 2 actief — decoraties zichtbaar
        await expect(page.getByText("Voeg decoraties toe")).toBeVisible()
    })

    test("voegt een decoratie toe in stap 2", async ({ page }) => {
        await page.getByText("Vierkant").click()
        await page.getByText("Naar decoraties").click()

        // Boom toevoegen
        // Alleen in de decoratielijst klikken
        await page.locator("button").filter({ hasText: "Boom" }).first().click()

        // Hierarchy toont de toegevoegde decoratie
        await expect(page.getByText("Boom 1")).toBeVisible()
    })

    test("kan niet naar checkout zonder decoratie", async ({ page }) => {
        await page.getByText("Vierkant").click()
        await page.getByText("Naar decoraties").click()

        await expect(page.getByText("Naar checkout")).toBeDisabled()
    })

    test("gaat naar checkout na platform + decoratie", async ({ page }) => {
        await page.getByText("Vierkant").click()
        await page.getByText("Naar decoraties").click()
        // Alleen in de decoratielijst klikken
        await page.locator("button").filter({ hasText: "Boom" }).first().click()

        await expect(page.getByText("Naar checkout")).toBeEnabled()
        await page.getByText("Naar checkout").click()

        await expect(page).toHaveURL("/checkout/overview", { timeout: 10000 })
    })

    test("checkout toont de juiste platformnaam en prijs", async ({ page }) => {
        await page.getByText("Vierkant").click()
        await page.getByText("Naar decoraties").click()
        // Alleen in de decoratielijst klikken
        await page.locator("button").filter({ hasText: "Boom" }).first().click()
        await page.getByText("Naar checkout").click()
        const decoratiesRij = page.locator("div").filter({ hasText: /^Decoraties/ }).first()

        await expect(page).toHaveURL("/checkout/overview", { timeout: 10000 })

        // Platform naam
        await expect(page.getByText("Vierkant")).toBeVisible()

        // 1 decoratie
        await expect(decoratiesRij.getByRole("heading", { name: "1" })).toBeVisible()

        // Prijs: €20 platform + €5 decoratie = €25
        await expect(page.getByText("€ 25.00")).toBeVisible()
    })

    test("reset scene wist alles", async ({ page }) => {
        await page.getByText("Vierkant").click()

        // Trash knop klikken
        await page.getByLabel("Leeg scene").click()

        // Bevestig reset
        await page.getByText("Ja, reset scene").click()

        // Terug naar begintoestand — knop disabled
        await expect(page.getByText("Naar decoraties")).toBeDisabled()
    })

    test("terug naar builder vanuit checkout behoudt de state", async ({ page }) => {
        await page.getByText("Vierkant").click()
        await page.getByText("Naar decoraties").click()
        // Alleen in de decoratielijst klikken
        await page.locator("button").filter({ hasText: "Boom" }).first().click()
        await page.getByText("Naar checkout").click()

        await expect(page).toHaveURL("/checkout/overview", { timeout: 10000 })

        // Terug naar builder
        await page.getByText("Terug naar builder").click()

        await expect(page).toHaveURL("/builder")

        // Platform nog steeds geselecteerd
        await expect(page.getByText("Naar decoraties")).toBeEnabled()
    })

    test("bestellen zonder sessie redirectt naar login", async ({ page }) => {
        await page.getByText("Vierkant").click()
        await page.getByText("Naar decoraties").click()
        // Alleen in de decoratielijst klikken
        await page.locator("button").filter({ hasText: "Boom" }).first().click()
        await page.getByText("Naar checkout").click()

        await expect(page).toHaveURL("/checkout/overview", { timeout: 10000 })

        await page.getByText("Bestellen").click()

        await expect(page).toHaveURL(/auth\/login/, { timeout: 10000 })
    })
})