import Link from "next/link"

export default function CheckoutIndexPage() {
	return (
		<section className="space-y-4 text-white">
			<h2 className="text-h2">Checkout start</h2>
			<p className="text-p text-white/75">
				De builder gebruikt stap 3 als bestelpagina. Vanaf daar ga je door naar deze checkout-flow.
			</p>
			<div className="flex flex-wrap gap-3">
				<Link
					href="/builder"
					className="inline-flex rounded-md border border-black/30 bg-black/25 px-4 py-2 text-sm"
				>
					Terug naar builder
				</Link>
				<Link
					href="/checkout/payment"
					className="inline-flex rounded-md border border-black/30 bg-[#98CEAA] px-4 py-2 text-sm text-black"
				>
					Ga naar betalen
				</Link>
			</div>
		</section>
	)
}

