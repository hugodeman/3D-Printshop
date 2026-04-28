"use client"

import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import {H1, H2, H3, P} from "@/components/ui/Typography"

type BuilderIntroModalProps = {
	isOpen: boolean
	onCloseAction: () => void
}

const STEP_ROWS = [
	{ id: 1, text: "Kies een platform en kies een grootte en kies een kleur." },
	{ id: 2, text: "Voeg decoraties en je figurine(s) toe en pas positie, rotatie, schaal en kleuren aan." },
	{ id: 3, text: "Ga naar het overzicht en bestel je product." },
]

export function BuilderIntroModal({ isOpen, onCloseAction }: BuilderIntroModalProps) {
	if (!isOpen) return null

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
			onClick={onCloseAction}
		>
			<div
				className="w-full max-w-4xl rounded-2xl border border-white/10 bg-[#1A1C1E] shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="h-2 w-full rounded-t-2xl bg-[#98CEAA]" />
				<div className="p-6 md:p-8">
					<div className="mb-10 flex items-start justify-between gap-4">
						<H1>Maak je eigen decoratieve stand voor je favoriete beeldjes!</H1>
					</div>

					<div className="space-y-4 border-b border-white/10 pb-6 mb-2">
						{STEP_ROWS.map((row) => (
							<div key={row.id} className="flex gap-3">
								<div className="flex mb-2 h-7 w-7 shrink-0 items-center align-baseline justify-center rounded-full bg-[#98CEAA] text-sm font-semibold text-[#1F2126]">
									{row.id}
								</div>
								<H3 className="text-white/85 mt-1 ml-1">{row.text}</H3>
							</div>
						))}
					</div>

					<div className="space-y-4 py-6">
						<div className="flex items-start gap-3">
							<div className="mt-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
								<Icon name="Network" size={24} color="#98CEAA" />
							</div>
							<div className={"flex flex-col justify-center align-baseline"}>
								<H3>Hierarchy</H3>
								<P className="text-white/90 mt-1">Hier zie je je platform en alle toegevoegde decoraties. Klik een item om het direct te selecteren hier, of in de scene.</P>
							</div>
						</div>

						<div className="flex items-start gap-3">
							<div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
								<Icon name="CircleQuestionMark" size={24} color="#98CEAA" />
							</div>
							<div>
								<H3>Help knop</H3>
								<P className="text-white/90 mt-1">Met het vraagteken open je altijd de controls-hulp tijdens het bouwen.</P>
							</div>
						</div>
					</div>
					<div className={"flex justify-center mt-5"}>
						<Button onClick={onCloseAction} className="gap-3 w-4/5 px-10">
							<div className={"flex items-center gap-3 justify-center"}>
								<H2 className={"text-contrast"}>Start met bouwen</H2>
								<Icon name="Rocket" size={20} color="#1F2126" />
							</div>
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}


