import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import LoginPage from "./page"
import { signIn } from "next-auth/react"

const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush }),
    useSearchParams: () => ({ get: () => null }),
}))

vi.mock("next-auth/react", () => ({
    signIn: vi.fn(),
}))

vi.mock("next/link", () => ({
    default: ({ children, href }: never) => <a href={href}>{children}</a>,
}))

describe("LoginPage", () => {
    beforeEach(() => {
        mockPush.mockClear()
        vi.mocked(signIn).mockClear()
    })

    it("rendert email en wachtwoord veld", () => {
        render(<LoginPage />)
        expect(screen.getByPlaceholderText("Email")).toBeInTheDocument()
        expect(screen.getByPlaceholderText("Wachtwoord")).toBeInTheDocument()
    })

    it("toont validatiefout bij leeg formulier", async () => {
        render(<LoginPage />)
        await userEvent.click(screen.getByText("Login"))
        expect(screen.getByText("Email is verplicht")).toBeInTheDocument()
        expect(screen.getByText("Wachtwoord is verplicht")).toBeInTheDocument()
    })

    it("toont fout bij ongeldig emailformaat", async () => {
        render(<LoginPage />)
        await userEvent.type(screen.getByPlaceholderText("Email"), "geengeldigemail")
        await userEvent.click(screen.getByText("Login"))
        await waitFor(() => {
            expect(screen.getByText("Ongeldig email adres")).toBeInTheDocument()
        })
    })

    it("roept signIn aan met juiste gegevens", async () => {
        vi.mocked(signIn).mockResolvedValue({code: undefined, error: "", ok: true, status: 200, url: "/" })
        render(<LoginPage />)

        await userEvent.type(screen.getByPlaceholderText("Email"), "jan@example.com")
        await userEvent.type(screen.getByPlaceholderText("Wachtwoord"), "wachtwoord123")
        await userEvent.click(screen.getByText("Login"))

        await waitFor(() => {
            expect(signIn).toHaveBeenCalledWith("credentials", {
                email: "jan@example.com",
                password: "wachtwoord123",
                redirect: false,
            })
        })
    })

    it("toont foutmelding bij verkeerde inloggegevens", async () => {
        vi.mocked(signIn).mockResolvedValue({ code: undefined, error: "CredentialsSignin", ok: false, status: 401, url: null })
        render(<LoginPage />)

        await userEvent.type(screen.getByPlaceholderText("Email"), "jan@example.com")
        await userEvent.type(screen.getByPlaceholderText("Wachtwoord"), "fout")
        await userEvent.click(screen.getByText("Login"))

        await waitFor(() => {
            const errors = screen.getAllByText("Ongeldig email of wachtwoord")
            expect(errors).toHaveLength(2) // staat bij zowel email als wachtwoord veld
        })
    })
})