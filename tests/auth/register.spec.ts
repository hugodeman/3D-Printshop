import { test, expect } from "@playwright/test"

test.describe("Registreren", () => {
    test("registreert een nieuwe gebruiker en wordt automatisch ingelogd", async ({ page }) => {
        const email = `testuser+${Date.now()}@example.com`
        const password = "Testw@chtwoord1"

        await page.goto("/auth/register")

        // Inloggegevens invullen
        await page.fill("[placeholder=\"Email\"]", email)
        await page.fill("[placeholder=\"Herhaal Email\"]", email)
        await page.fill("[placeholder=\"Wachtwoord\"]", password)
        await page.fill("[placeholder=\"Herhaal Wachtwoord\"]", password)

        await page.click("text=Account aanmaken")

        // Na registratie automatisch ingelogd → redirect naar /
        await expect(page).toHaveURL("/", { timeout: 10000 })
    })

    test("registreert met adres", async ({ page }) => {
        const email = `testuser+${Date.now()}@example.com`
        const password = "Testw@chtwoord1"

        await page.goto("/auth/register")

        await page.fill("[placeholder=\"Email\"]", email)
        await page.fill("[placeholder=\"Herhaal Email\"]", email)
        await page.fill("[placeholder=\"Wachtwoord\"]", password)
        await page.fill("[placeholder=\"Herhaal Wachtwoord\"]", password)

        // Adres invullen
        await page.selectOption("select", "Nederland")
        await page.fill("[placeholder=\"Voornaam\"]", "Jan")
        await page.fill("[placeholder=\"Achternaam\"]", "de Vries")
        await page.fill("[placeholder=\"Adres\"]", "Teststraat 1")
        await page.fill("[placeholder=\"Postcode\"]", "1234 AB")
        await page.fill("[placeholder=\"Woonplaats\"]", "Amsterdam")

        await page.click("text=Account aanmaken")

        await expect(page).toHaveURL("/", { timeout: 10000 })
    })
})