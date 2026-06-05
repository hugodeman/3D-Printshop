import { render, screen } from "@testing-library/react"
import { MeasurementDisplay } from "./MeasurementTool"

describe("MeasurementDisplay", () => {
    it("rendert niets als isActive false is", () => {
        const { container } = render(<MeasurementDisplay distance={null} isActive={false} />)
        expect(container.firstChild).toBeNull()
    })

    it("toont instructies als er nog geen afstand is", () => {
        render(<MeasurementDisplay distance={null} isActive={true} />)
        expect(screen.getByText("Meet modus ACTIEF")).toBeInTheDocument()
    })

    it("toont de gemeten afstand", () => {
        render(<MeasurementDisplay distance={12.5} isActive={true} />)
        expect(screen.getByText("12.50 cm")).toBeInTheDocument()
    })

    it("toont instructies als distance 0 is", () => {
        render(<MeasurementDisplay distance={0} isActive={true} />)
        expect(screen.getByText("Meet modus ACTIEF")).toBeInTheDocument()
    })
})