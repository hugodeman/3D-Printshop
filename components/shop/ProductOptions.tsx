"use client"

import { useState } from "react"

type Props = {
    type: string
    options: {
        paintable: boolean | null
        color: string | null
    } | null
    onChangeAction: (value: string) => void
}

const COLORS = [
    "Zwart", "wit", "Geel", "Groen", "Blauw", "Bruin", "Rood", "Paars"
]

export default function ProductOptions({ type, options, onChangeAction }: Props) {
    const [selected, setSelected] = useState("")

    const handleChange = (value: string) => {
        setSelected(value)
        onChangeAction(value)
    }

    if (!options) return null

    if (type === "FIGURE") {
        return (
            <select
                value={selected}
                onChange={(e) => handleChange(e.target.value)}
                className="rounded-[5px] border input-shadow outline-none transition-colors h-12 px-4 text-p w-full bg-input-normal border-input-normal cursor-pointer"
            >
                <option value="" disabled hidden>Kies opmaak</option>
                <option value="Geverfd">Geverfd</option>
                <option value="Niet geverfd">Niet geverfd</option>
            </select>
        )
    }

    if (type === "PRACTICAL") {
        return (
            <select
                value={selected}
                onChange={(e) => handleChange(e.target.value)}
                className="rounded-[5px] border input-shadow outline-none transition-colors h-12 px-4 text-p w-full bg-input-normal border-input-normal cursor-pointer"
            >
                <option value="" disabled hidden>Kies kleur</option>
                {COLORS.map((color) => (
                    <option key={color} value={color}>{color}</option>
                ))}
            </select>
        )
    }
}