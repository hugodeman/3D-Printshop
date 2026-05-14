"use client"

import { useState } from "react"

type Props = {
    type: "FIGURE" | "PRACTICAL"
    options: {
        paintable: boolean | null
        color: string | null
    } | null
}

const COLORS = [
    "Zwart", "wit", "Geel", "Groen", "Blauw", "Bruin", "Rood", "Paars"
]

export default function ProductOptions({ type, options }: Props) {
    const [selected, setSelected] = useState("")

    if (!options) return null

    if (type === "FIGURE") {
        return (
            <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="rounded-[5px] border input-shadow outline-none transition-colors h-12 px-4 text-p w-full bg-input-normal border-input-normal"
            >
                <option value="" disabled hidden>Kies opmaak</option>
                <option value="painted">Geschilderd</option>
                <option value="unpainted">Ongeschilderd</option>
            </select>
        )
    }

    if (type === "PRACTICAL") {
        return (
            <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="rounded-[5px] border input-shadow outline-none transition-colors h-12 px-4 text-p w-full bg-input-normal border-input-normal"
            >
                <option value="" disabled hidden>Kies kleur</option>
                {COLORS.map((color) => (
                    <option key={color} value={color}>{color}</option>
                ))}
            </select>
        )
    }
}