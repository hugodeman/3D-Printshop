"use client"

import { P } from "@/components/ui/Typography"

function normalizeHexColor(value: string) {
	const withHash = value.startsWith("#") ? value : `#${value}`
	const isHex = /^#[0-9a-fA-F]{6}$/.test(withHash)
	return isHex ? withHash.toUpperCase() : null
}

interface ColorInputProps {
	label: string
	value: string
	onChange: (value: string) => void
	inputValue: string
	onInputChange: (value: string) => void
	onBlur?: () => void
}

export function ColorInput({
	label,
	value,
	onChange,
	inputValue,
	onInputChange,
	onBlur,
}: ColorInputProps) {
	return (
		<div>
			<P className="mb-3 mt-2 capitalize">{label}</P>
			<div className="flex items-center gap-2">
				<input
					type="color"
					value={value}
					onChange={(e) => {
						const next = e.currentTarget.value.toUpperCase()
						onInputChange(next)
						onChange(next)
					}}
					className="h-10 w-50 cursor-pointer rounded border border-white/15 bg-black/20"
				/>
				<input
					type="text"
					inputMode="text"
					maxLength={7}
					value={inputValue}
					onChange={(e) => {
						const raw = e.currentTarget.value.toUpperCase()
						onInputChange(raw)
						const normalized = normalizeHexColor(raw)
						if (normalized) onChange(normalized)
					}}
					onBlur={onBlur}
					className="h-10 w-3/5 rounded border border-white/15 bg-black/30 pl-2"
					placeholder="#RRGGBB"
				/>
			</div>
		</div>
	)
}

