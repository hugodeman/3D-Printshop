"use client"

import { useMemo, useState } from "react"

import { Icon } from "@/components/ui/Icon"
import { H2, H3 } from "@/components/ui/Typography"

type HelpItem = {
	icon: string
	label: string
	iconWidthClassName?: string
}

export function SceneHelp() {
	const [isOpen, setIsOpen] = useState(false)

	const helpItems = useMemo<HelpItem[]>(() => [
		{ icon: "Mouse", label: "Linker muisklik + slepen: scene draaien" },
		{ icon: "SquareChevronUp", label: "Ctrl + klik + slepen: scene schuiven" },
		{ icon: "MoveVertical", label: "Scrollen: zoomen" },
		{ icon: "MousePointerClick", label: "Klik op modellen om te selecteren" },
		{ icon: "Sliders", label: "Gebruik sliders om het model aan te passen" },
		{ icon: "Paintbrush2", label: "Gebruik kleurbalken om kleur aan te passen" },
	], [])

	return (
		<>
			{isOpen && (
				<div className="absolute top-[clamp(0.75rem,2vh,1.5rem)] right-[clamp(0.75rem,2vw,1.5rem)] z-20 w-[min(92vw,28rem)] rounded-2xl border border-white/20 bg-[#1F2126]/95 p-4 shadow-[0_10px_25px_rgba(0,0,0,0.45)] backdrop-blur-sm">
					<div className="mb-4 flex items-center justify-between">
						<div className="ml-2 flex items-center gap-6">
							<Icon name="Info" size={20} color="#98CEAA" />
							<H2>Controls</H2>
						</div>
						<button
							type="button"
							onClick={() => setIsOpen(false)}
							className="rounded-md px-2 py-1"
							aria-label="Sluit hulp"
						>
							<Icon name="X" size={30} color="#FFFFFF" />
						</button>
					</div>

					<div className="space-y-5">
						{helpItems.map((item) => (
							<div key={item.label} className="flex items-center gap-3">
								<div className={`flex h-10 ${item.iconWidthClassName ?? "w-10"} items-center justify-center rounded-lg bg-white/5`}>
									<Icon name={item.icon} size={20} color="#98CEAA" />
								</div>
								<H3 className="text-white/90">{item.label}</H3>
							</div>
						))}
					</div>
				</div>
			)}

			<button
				type="button"
				onClick={() => setIsOpen((prev) => !prev)}
				className="absolute z-10 flex items-center justify-center rounded-full border border-white/20 bg-[#1F2126]/80 backdrop-blur-sm transition hover:bg-[#2A2D31] bottom-[calc(clamp(0.75rem,2vh,1.5rem)+clamp(2.75rem,5vmin,3.75rem)+0.75rem)] right-[clamp(0.75rem,2vw,1.5rem)] h-[clamp(2.75rem,5vmin,3.75rem)] w-[clamp(2.75rem,5vmin,3.75rem)]"
				aria-label={isOpen ? "Verberg hulp" : "Toon hulp"}
				title={isOpen ? "Verberg hulp" : "Toon hulp"}
			>
				<Icon
					name="CircleQuestionMark"
					size={22}
					color={isOpen ? "#98CEAA" : "#FFFFFF"}
					className="h-[clamp(1rem,2.2vmin,1.4rem)] w-[clamp(1rem,2.2vmin,1.4rem)]"
				/>
			</button>
		</>
	)
}

