import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ColorInput } from "./ColorInput"
import {useState} from "react";

describe("ColorInput", () => {
    it("toont het label", () => {
        render(
            <ColorInput label="Kleur" value="#FF0000" onChange={vi.fn()} inputValue="#FF0000" onInputChange={vi.fn()} />
        )
        expect(screen.getByText("Kleur")).toBeInTheDocument()
    })

    it("roept onChange aan bij geldige hex in tekstveld", async () => {
        const onChange = vi.fn()

        function Wrapper() {
            const [inputValue, setInputValue] = useState("")
            return (
                <ColorInput
                    label="Kleur"
                    value="#000000"
                    onChange={onChange}
                    inputValue={inputValue}
                    onInputChange={setInputValue}
                />
            )
        }

        render(<Wrapper />)
        await userEvent.type(screen.getByPlaceholderText("#RRGGBB"), "#FF0000")
        expect(onChange).toHaveBeenCalledWith("#FF0000")
    })

    it("roept onChange NIET aan bij ongeldige hex", async () => {
        const onChange = vi.fn()
        const onInputChange = vi.fn()
        render(
            <ColorInput label="Kleur" value="#000000" onChange={onChange} inputValue="" onInputChange={onInputChange} />
        )

        const textInput = screen.getByPlaceholderText("#RRGGBB")
        await userEvent.type(textInput, "geenkleur")

        expect(onChange).not.toHaveBeenCalled()
    })

    it("normaliseert hex naar uppercase", async () => {
        const onChange = vi.fn()

        function Wrapper() {
            const [inputValue, setInputValue] = useState("")
            return (
                <ColorInput
                    label="Kleur"
                    value="#000000"
                    onChange={onChange}
                    inputValue={inputValue}
                    onInputChange={setInputValue}
                />
            )
        }

        render(<Wrapper />)
        await userEvent.type(screen.getByPlaceholderText("#RRGGBB"), "#ff0000")
        expect(onChange).toHaveBeenCalledWith("#FF0000")
    })

    it("roept onBlur aan bij verlaten van tekstveld", async () => {
        const onBlur = vi.fn()
        render(
            <ColorInput label="Kleur" value="#000000" onChange={vi.fn()} inputValue="" onInputChange={vi.fn()} onBlur={onBlur} />
        )

        const textInput = screen.getByPlaceholderText("#RRGGBB")
        await userEvent.click(textInput)
        await userEvent.tab()

        expect(onBlur).toHaveBeenCalledOnce()
    })
})