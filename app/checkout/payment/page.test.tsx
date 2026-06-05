// checkout/payment/page.test.tsx
import { render, screen, waitFor } from "@testing-library/react"
import CheckoutPaymentPage from "./page"

vi.mock("next/navigation", () => ({
    useSearchParams: vi.fn(),
}))
vi.mock("next/link", () => ({
    default: ({ children, href }: never) => <a href={href}>{children}</a>,
}))

import { useSearchParams } from "next/navigation"

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
    vi.clearAllMocks()
})

describe("CheckoutPaymentPage", () => {
    it("toont foutmelding als geen orderId in URL", () => {
        vi.mocked(useSearchParams).mockReturnValue({
            //eslint-disable-next-line @typescript-eslint/no-unused-vars
            get: (key: string) => null,
        } as never)

        render(<CheckoutPaymentPage />)
        expect(screen.getByText("Geen bestelling gevonden")).toBeInTheDocument()
    })

    it("toont PAID status na succesvolle betaling", async () => {
        vi.mocked(useSearchParams).mockReturnValue({
            get: (key: string) => key === "orderId" ? "order-123" : null,
        } as never)

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ id: "order-123", status: "PAID", total: "25.00" }),
        })

        render(<CheckoutPaymentPage />)

        await waitFor(() => {
            expect(screen.getByText("Betaling gelukt!")).toBeInTheDocument()
        })
        expect(screen.getByText(/25\.00/)).toBeInTheDocument()
    })

    it("toont PENDING status", async () => {
        vi.mocked(useSearchParams).mockReturnValue({
            get: (key: string) => key === "orderId" ? "order-123" : null,
        } as never)

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ id: "order-123", status: "PENDING", total: "25.00" }),
        })

        render(<CheckoutPaymentPage />)

        await waitFor(() => {
            expect(screen.getByText("Betaling in behandeling")).toBeInTheDocument()
        })
    })

    it("toont COMPLETED status", async () => {
        vi.mocked(useSearchParams).mockReturnValue({
            get: (key: string) => key === "orderId" ? "order-123" : null,
        } as never)

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ id: "order-123", status: "COMPLETED", total: "25.00" }),
        })

        render(<CheckoutPaymentPage />)

        await waitFor(() => {
            expect(screen.getByText("Bestelling voltooid!")).toBeInTheDocument()
        })
    })

    it("toont foutmelding als order niet gevonden", async () => {
        vi.mocked(useSearchParams).mockReturnValue({
            get: (key: string) => key === "orderId" ? "order-123" : null,
        } as never)

        mockFetch.mockResolvedValue({ ok: false })

        render(<CheckoutPaymentPage />)

        await waitFor(() => {
            expect(screen.getByText("Kon bestelling niet ophalen.")).toBeInTheDocument()
        })
    })

    it("toont mock betaling knop als mock=1 in URL", async () => {
        vi.mocked(useSearchParams).mockReturnValue({
            get: (key: string) => {
                if (key === "orderId") return "order-123"
                if (key === "mock") return "1"
                return null
            },
        } as never)

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ id: "order-123", status: "PENDING", total: "25.00" }),
        })

        render(<CheckoutPaymentPage />)

        await waitFor(() => {
            expect(screen.getByText("Simuleer betaling gelukt")).toBeInTheDocument()
        })
    })
})