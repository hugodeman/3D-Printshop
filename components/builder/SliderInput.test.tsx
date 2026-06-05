import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SliderInput } from "./SliderInput"
import { fireEvent } from "@testing-library/react"

describe("SliderInput", () => {
    it("toont het label", () => {
        render(<SliderInput label="Schaal" value={1} onChange={vi.fn()} min={0} max={2} step={0.1} />)
        expect(screen.getByText("Schaal")).toBeInTheDocument()
    })

    it("toont min en max waarden", () => {
        render(<SliderInput label="Schaal" value={1} onChange={vi.fn()} min={0} max={2} step={0.1} />)
        expect(screen.getByText("0.00")).toBeInTheDocument()
        expect(screen.getByText("2.00")).toBeInTheDocument()
    })

    it("gebruikt displayFormat voor de weergave", () => {
        render(
            <SliderInput
                label="Rotatie"
                value={Math.PI}
                onChange={vi.fn()}
                min={0}
                max={Math.PI * 2}
                step={0.01}
                displayFormat={(v) => String(Math.round((v * 180) / Math.PI))}
            />
        )
        const numberInput = screen.getByRole("spinbutton")
        expect(numberInput).toHaveValue(180)
    })

    it("gebruikt displayMinMax voor min en max labels", () => {
        render(
            <SliderInput
                label="Rotatie"
                value={0}
                onChange={vi.fn()}
                min={0}
                max={Math.PI * 2}
                step={0.01}
                displayMinMax={(v) => `${Math.round((v * 180) / Math.PI)}°`}
            />
        )
        expect(screen.getByText("0°")).toBeInTheDocument()
        expect(screen.getByText("360°")).toBeInTheDocument()
    })

    it("roept onChange aan bij slider aanpassing", () => {
        const onChange = vi.fn()
        render(<SliderInput label="Schaal" value={1} onChange={onChange} min={0} max={2} step={0.1} />)

        const slider = screen.getByRole("slider")
        fireEvent.change(slider, { target: { value: "1.5" } })

        expect(onChange).toHaveBeenCalledWith(1.5)
    })

    it("roept onChange niet aan bij ongeldige invoer in nummerveld", async () => {
        const onChange = vi.fn()
        render(<SliderInput label="Schaal" value={1} onChange={onChange} min={0} max={2} step={0.1} />)

        const numberInput = screen.getByRole("spinbutton")
        await userEvent.type(numberInput, "abc") // geen clear — alleen letters typen

        expect(onChange).not.toHaveBeenCalled()
    })
})