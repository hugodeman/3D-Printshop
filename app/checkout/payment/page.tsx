"use client"

import Link from "next/link"
import { useSyncExternalStore } from "react"
import {
	readBuilderCheckoutDraft,
	subscribeBuilderCheckoutDraft,
	type BuilderCheckoutDraft,
} from "@/lib/builder-checkout-draft"

export default function CheckoutPaymentPage() {
	const draft = useSyncExternalStore<BuilderCheckoutDraft | null>(
		subscribeBuilderCheckoutDraft,
		readBuilderCheckoutDraft,
		() => null,
	)

	if (!draft) {
		return (
			<section className="space-y-4">
				<h2 className="text-h2">Betalen</h2>
				<p className="text-p text-white/75">Er is nog geen builder-bestelling klaar om te betalen.</p>
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
				<h2 className="text-h2">Betalen</h2>
				<p className="mt-2 text-p text-white/75">
					Hier komt straks je Mollie-koppeling. Voor nu zie je alvast welke builder-configuratie wordt afgerekend.
				</p>
			</div>

			<div className="rounded-md border border-black/20 bg-black/20 p-4">
				<p className="text-sm font-medium">Bestelsamenvatting</p>
				<p className="mt-2 text-sm text-white/80">Platform: {draft.platformName}</p>
				<p className="mt-1 text-sm text-white/80">Aantal decoraties: {draft.totalItems}</p>
				<ul className="mt-3 space-y-1 text-sm text-white/75">
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
					Terug naar builder
				</Link>
				<Link
					href="/checkout/overview"
					className="inline-flex rounded-md border border-black/30 bg-[#98CEAA] px-4 py-2 text-sm text-black"
				>
					Simuleer afgeronde betaling
				</Link>
			</div>
		</section>
	)
}


