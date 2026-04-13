"use client"

import { Button } from "@/components/ui/Button"
import { H2, P } from "@/components/ui/Typography"

type BuilderResetConfirmModalProps = {
	isOpen: boolean
	onCancelAction: () => void
	onConfirmAction: () => void
}

export function BuilderResetConfirmModal({
	isOpen,
	onCancelAction,
	onConfirmAction,
}: BuilderResetConfirmModalProps) {
	if (!isOpen) return null

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
			onClick={onCancelAction}
		>
			<div
				className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#1A1C1E] shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="h-2 w-full rounded-t-2xl bg-[#98CEAA]" />
				<div className="p-6 md:p-8">
					<H2>Scene resetten?</H2>
					<P className="mt-5">
						Dit verwijdert je platform, decoraties en opgeslagen scene.
					</P>

					<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
						<Button variant="secondary" onClick={onCancelAction} className="sm:min-w-40">
							Annuleren
						</Button>
						<Button onClick={onConfirmAction} className="sm:min-w-40">
							Ja, reset scene
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}

