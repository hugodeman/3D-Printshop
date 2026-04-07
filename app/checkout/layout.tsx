import type { ReactNode } from "react"

export default function CheckoutLayout({ children }: { children: ReactNode }) {
	return (
		<main className="min-h-[calc(100vh-120px)] bg-main p-4 text-white">
			<div className="mx-auto max-w-5xl rounded-md border border-black/20 bg-contrast-2 p-6">
				<div className="border-b border-black/20 pb-4">
					<p className="text-xs uppercase tracking-[0.2em] text-white/60">Checkout</p>
					<h1 className="text-h1">Bestellen en betalen</h1>
					<p className="mt-2 text-p text-white/75">
						Deze flow wordt gedeeld door de builder en straks ook door de webshop.
					</p>
				</div>
				<div className="mt-6">{children}</div>
			</div>
		</main>
	)
}

