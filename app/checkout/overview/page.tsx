"use client"

import Link from "next/link"
import { useSyncExternalStore } from "react"
import {
	readBuilderCheckoutDraft,
	subscribeBuilderCheckoutDraft,
	type BuilderCheckoutDraft,
} from "@/lib/builder-checkout-draft"

export default function CheckoutOverviewPage() {
	const draft = useSyncExternalStore<BuilderCheckoutDraft | null>(
		subscribeBuilderCheckoutDraft,
		readBuilderCheckoutDraft,
		() => null,
	)

	if (!draft) {
		return (
			<section className="space-y-4">
				<h2 className="text-h2">Overzicht</h2>
				<p className="text-p text-white/75">Er is nog geen afgeronde builder-bestelling beschikbaar.</p>
				<Link
					href="/builder"
					className="inline-flex rounded-md border border-black/30 bg-[#98CEAA] px-4 py-2 text-sm text-black"
				>
					Terug naar builder
				</Link>
			</section>
		)
	}

	return (
		<section className="space-y-6">
			<div>
				<h2 className="text-h2">Bestellingsoverzicht</h2>
				<p className="mt-2 text-p text-white/75">
					Dit is de plek waar je straks de betaalstatus, orderinformatie en eventueel een preview-link toont.
				</p>
			</div>

			<div className="rounded-md border border-black/20 bg-black/20 p-4 text-sm text-white/80">
				<p><span className="font-medium text-white">Platform:</span> {draft.platformName}</p>
				<p className="mt-1"><span className="font-medium text-white">Decoraties:</span> {draft.totalItems}</p>
				<p className="mt-1"><span className="font-medium text-white">Concept opgeslagen op:</span> {new Date(draft.createdAt).toLocaleString("nl-NL")}</p>
				<ul className="mt-3 space-y-1 text-white/75">
					{draft.decorations.map((decoration) => (
						<li key={decoration.instanceId}>- {decoration.name}</li>
					))}
				</ul>
			</div>

			<div className="flex flex-wrap gap-3">
				<Link
					href="/builder"
					className="inline-flex rounded-md border border-black/30 bg-black/25 px-4 py-2 text-sm"
				>
					Creatie opnieuw aanpassen
				</Link>
				<Link
					href="/checkout/payment"
					className="inline-flex rounded-md border border-black/30 bg-[#98CEAA] px-4 py-2 text-sm text-black"
				>
					Terug naar betalen
				</Link>
			</div>
		</section>
	)
}

