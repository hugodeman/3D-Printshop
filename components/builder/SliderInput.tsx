import { P } from "@/components/ui/Typography"

interface SliderInputProps {
	label: string
	value: number
	onChange: (value: number) => void
	min: number
	max: number
	step: number
	// Format value for display (e.g. radians to degrees)
	displayFormat?: (value: number) => string
	// Parse display value (e.g. degrees to radians)
	parseDisplay?: (value: string) => number
	// Format min/max for display
	displayMinMax?: (value: number) => string
}

export function SliderInput({
	label,
	value,
	onChange,
	min,
	max,
	step,
	displayFormat = (v) => v.toFixed(2),
	parseDisplay = (v) => Number(v),
	displayMinMax,
}: SliderInputProps) {
	const displayValue = displayFormat(value)
	const displayMin = displayMinMax ? displayMinMax(min) : min.toFixed(2)
	const displayMax = displayMinMax ? displayMinMax(max) : max.toFixed(2)

	return (
		<label className="block text-xs">
			<div className="mb-1 mr-2 flex items-center justify-between">
				<P className={"pl-1"}>{label}</P>
				<input
					type="number"
					min={min}
					max={max}
					step={step}
					value={displayValue}
					onChange={(e) => {
						const parsed = parseDisplay(e.currentTarget.value)
						if (Number.isFinite(parsed)) {
							onChange(parsed)
						}
					}}
					className="w-20 rounded border border-white/15 bg-black/30 px-2 py-1 text-right"
				/>
			</div>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.currentTarget.value))}
				className="slider w-full appearance-none rounded-lg bg-[#98CEAA]/65 p-1"
			/>
			<div className="text-xs text-white/50 mr-2 flex items-center justify-between mt-1">
				<span>{displayMin}</span>
				<span>{displayMax}</span>
			</div>
		</label>
	)
}


