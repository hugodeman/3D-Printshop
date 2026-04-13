import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { H3 } from "@/components/ui/Typography"

type StepItem = {
	id: number
	label: string
	done?: boolean
	isCurrent?: boolean
	disabled?: boolean
	onClick?: () => void
}

type StepButtonsProps = {
	steps: StepItem[]
	onInfoClick?: () => void
	onClearClick?: () => void
	clearDisabled?: boolean
}

export function StepButtons({ steps, onInfoClick, onClearClick, clearDisabled }: StepButtonsProps) {
	return (
		<div className="relative mb-2 flex w-full items-center justify-center">
			<div className="flex items-center gap-10">
				{steps.map((step, index) => {
					const stateClasses = step.done
						? "!bg-[#6D8F78]/80 !text-[#1F2126] hover:!bg-[#6D8F78]"
						: step.isCurrent
							? "!bg-[#98CEAA] !text-[#1F2126]"
							: "!bg-[#CAC4D0]/50 !text-[#1F2126]/70"

					return (
						<div key={step.id} className="flex items-center gap-10">
							{index > 0 && <Icon name="Minus" size={30} color="#ffffff99" />}
							<Button
								variant={step.isCurrent ? "primary" : "secondary"}
								isActive={step.isCurrent}
								disabled={step.disabled}
								onClick={step.onClick}
								className={`flex items-center gap-4 rounded-full! px-3 py-2 text-[#1F2126]! ${stateClasses}`}
								style={step.isCurrent ? { boxShadow: "0 10px 15px rgba(179,234,197,0.15)" } : undefined}
							>
								{step.done && <Icon name="CircleCheck" color="#B3EAC5" size={22} />}
								<H3 className="text-contrast">Stap {step.id}: {step.label}</H3>
							</Button>
						</div>
					)
				})}
			</div>

			{(onClearClick || onInfoClick) && (
				<div className="absolute right-1 flex items-center gap-10">
					{onClearClick && (
						<button
							type="button"
							onClick={onClearClick}
							disabled={clearDisabled}
							className="flex h-13 w-13 items-center justify-center rounded-full border border-red-300/40 bg-[#1F2126]/90 transition enabled:hover:bg-[#2A2D31] disabled:cursor-not-allowed disabled:opacity-50"
							aria-label="Leeg scene"
							title="Leeg scene"
						>
							<Icon name="Trash2" size={22} color="#FCA5A5" />
						</button>
					)}

					{onInfoClick && (
						<button
							type="button"
							onClick={onInfoClick}
							className="flex h-13 w-13 items-center justify-center rounded-full border border-[#98CEAA]/40 bg-[#1F2126]/90 transition hover:bg-[#2A2D31]"
							aria-label="Toon builder uitleg"
							title="Toon builder uitleg"
						>
							<Icon name="Info" size={24} color="#98CEAA" />
						</button>
					)}
				</div>
			)}
		</div>
	)
}

