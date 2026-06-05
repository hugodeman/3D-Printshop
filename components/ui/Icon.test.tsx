import { render } from "@testing-library/react"
import { Icon } from "./Icon"

describe("Icon", () => {
    it("rendert een geldig icon als SVG", () => {
        const { container } = render(<Icon name="Minus" />)
        expect(container.querySelector("svg")).toBeInTheDocument()
    })

    it("geeft null terug bij onbekend icon", () => {
        const { container } = render(<Icon name="BestaatNiet" />)
        expect(container.firstChild).toBeNull()
    })

    it("logt een waarschuwing bij onbekend icon", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
        render(<Icon name="BestaatNiet" />)
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("BestaatNiet"))
        warn.mockRestore()
    })
})