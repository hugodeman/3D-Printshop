import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import RegisterPage from "./page"
import { signIn } from "next-auth/react"

vi.mock("next-auth/react", () => ({ signIn: vi.fn() }))
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
    useSearchParams: () => ({ get: () => null }),
}))

// fetch mocken
const mockFetch = vi.fn()
global.fetch = mockFetch

describe("RegisterPage", () => {
    beforeEach(() => {
        mockFetch.mockClear()
        vi.mocked(signIn).mockClear()
    })

    it("toont verplichte velden", () => {
        render(<RegisterPage />)
        expect(screen.getByPlaceholderText("Email")).toBeInTheDocument()
        expect(screen.getByPlaceholderText("Herhaal Email")).toBeInTheDocument()
        expect(screen.getByPlaceholderText("Wachtwoord")).toBeInTheDocument()
        expect(screen.getByPlaceholderText("Herhaal Wachtwoord")).toBeInTheDocument()
    })

    it("toont fout als emails niet overeenkomen", async () => {
        render(<RegisterPage />)
        await userEvent.type(screen.getByPlaceholderText("Email"), "jan@example.com")
        await userEvent.type(screen.getByPlaceholderText("Herhaal Email"), "anders@example.com")
        await userEvent.click(screen.getByText("Account aanmaken"))
        expect(screen.getByText("Emails komen niet overeen")).toBeInTheDocument()
    })

    it("toont fout als wachtwoorden niet overeenkomen", async () => {
        render(<RegisterPage />)
        await userEvent.type(screen.getByPlaceholderText("Wachtwoord"), "wachtwoord123")
        await userEvent.type(screen.getByPlaceholderText("Herhaal Wachtwoord"), "anders123")
        await userEvent.click(screen.getByText("Account aanmaken"))
        expect(screen.getByText("Wachtwoorden komen niet overeen")).toBeInTheDocument()
    })

    it("toont fout als wachtwoord korter dan 8 karakters is", async () => {
        render(<RegisterPage />)
        await userEvent.type(screen.getByPlaceholderText("Wachtwoord"), "kort")
        await userEvent.click(screen.getByText("Account aanmaken"))
        expect(screen.getByText("Wachtwoord moet minimaal 8 karakters bevatten")).toBeInTheDocument()
    })

    it("toont adresfouten als adres gedeeltelijk ingevuld is", async () => {
        render(<RegisterPage />)
        await userEvent.type(screen.getByPlaceholderText("Voornaam"), "Jan")
        await userEvent.click(screen.getByText("Account aanmaken"))
        expect(screen.getByText("Achternaam is verplicht als je een adres invult")).toBeInTheDocument()
        expect(screen.getByText("Adres is verplicht als je een adres invult")).toBeInTheDocument()
    })

    it("toont 409 fout als email al in gebruik is", async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({ error: "Email is al in gebruik" }),
        })

        render(<RegisterPage />)
        await userEvent.type(screen.getByPlaceholderText("Email"), "jan@example.com")
        await userEvent.type(screen.getByPlaceholderText("Herhaal Email"), "jan@example.com")
        await userEvent.type(screen.getByPlaceholderText("Wachtwoord"), "wachtwoord123")
        await userEvent.type(screen.getByPlaceholderText("Herhaal Wachtwoord"), "wachtwoord123")
        await userEvent.click(screen.getByText("Account aanmaken"))

        await waitFor(() => {
            expect(screen.getByText("Email is al in gebruik")).toBeInTheDocument()
        })
    })

    it("logt automatisch in na succesvolle registratie", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 201,
            json: async () => ({ id: "1", email: "jan@example.com" }),
        })
        vi.mocked(signIn).mockResolvedValue({code: undefined, error: "", ok: true, status: 200, url: "/" })

        render(<RegisterPage />)
        await userEvent.type(screen.getByPlaceholderText("Email"), "jan@example.com")
        await userEvent.type(screen.getByPlaceholderText("Herhaal Email"), "jan@example.com")
        await userEvent.type(screen.getByPlaceholderText("Wachtwoord"), "wachtwoord123")
        await userEvent.type(screen.getByPlaceholderText("Herhaal Wachtwoord"), "wachtwoord123")
        await userEvent.click(screen.getByText("Account aanmaken"))

        await waitFor(() => {
            expect(signIn).toHaveBeenCalledWith("credentials", {
                email: "jan@example.com",
                password: "wachtwoord123",
                redirectTo: "/",
            })
        })
    })
})