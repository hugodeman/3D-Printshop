"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { H2, H3, P } from "@/components/ui/Typography"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import {useCart} from "@/context/CartContext";

type OrderStatus = "PENDING" | "PAID" | "COMPLETED"

type OrderResult = {
	id: string
	status: OrderStatus
	total: string
}

function CheckoutPaymentContent() {
	const searchParams = useSearchParams()
	const orderId = searchParams.get("orderId")
	const isMockPayment = searchParams.get("mock") === "1"
	const [order, setOrder] = useState<OrderResult | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isSimulating, setIsSimulating] = useState(false)

	const { clearCart } = useCart()

	async function fetchOrder(nextOrderId: string) {
		const res = await fetch(`/api/orders/${nextOrderId}`)
		if (!res.ok) {
			throw new Error("ORDER_NOT_FOUND")
		}
		return (await res.json()) as OrderResult
	}

	async function simulateMockPaymentSuccess() {
		if (!orderId) return
		setIsSimulating(true)
		setError(null)

		try {
			const res = await fetch(`/api/orders/${orderId}/mock-pay`, { method: "POST" })
			if (!res.ok) {
				const result = (await res.json()) as { error?: string }
				setError(result.error ?? "Mock betaling mislukt.")
				return
			}

			const updated = await fetchOrder(orderId)
			setOrder(updated)
			clearCart() // clear shoppingcart after payment

		} catch {
			setError("Kon mock betaling niet uitvoeren.")
		} finally {
			setIsSimulating(false)
		}
	}

	useEffect(() => {
		if (!orderId) {
			setLoading(false)
			return
		}

		// Poll the order status briefly — Mollie may not have fired the webhook yet
		let attempts = 0
		const poll = async () => {
			try {
				const data = await fetchOrder(orderId)
				setOrder(data)
				setLoading(false)
				// If still pending and we haven't polled too many times, retry
				if (data.status === "PENDING" && attempts < 5) {
					attempts++
					setTimeout(poll, 2000)
				}
			} catch {
				setError("Kon bestelling niet ophalen.")
				setLoading(false)
			}
		}
		void poll()
	}, [orderId])

	if (!orderId) {
		return (
			<section className="flex h-[calc(100vh-120px)] flex-col items-center justify-center gap-4 bg-[#1A1C1E] text-white">
				<H3>Geen bestelling gevonden</H3>
				<Link href="/builder">
					<Button>Terug naar builder</Button>
				</Link>
			</section>
		)
	}

	const printFileDownloadUrl = `/api/orders/${orderId}/print-file`

	return (
		<section className="flex h-[calc(100vh-120px)] flex-col items-center justify-center gap-6 bg-[#1A1C1E] text-white">
			{isMockPayment && !loading && (
				<div className="flex flex-col items-center gap-3 rounded-xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-amber-200">
					<P>Dev modus: Mollie is niet geconfigureerd, dus dit is een lokale betaalfallback.</P>
					{order?.status === "PENDING" && (
						<Button
							onClick={simulateMockPaymentSuccess}
							disabled={isSimulating}
							className="min-w-56"
						>
							{isSimulating ? "Verwerken..." : "Simuleer betaling gelukt"}
						</Button>
					)}
					{order && (
						<Link href={printFileDownloadUrl} target="_blank" rel="noreferrer">
							<Button variant="secondary" className="min-w-56">
								<Icon name="Download" size={18} color="#FFFFFF" />
								Test download printbestand
							</Button>
						</Link>
					)}
				</div>
			)}

			{loading && (
				<>
					<Icon name="LoaderCircle" size={40} color="#98CEAA" className="animate-spin" />
					<P className="text-white/70">Betaalstatus ophalen…</P>
				</>
			)}

			{!loading && error && (
				<>
					<Icon name="CircleX" size={40} color="#FCA5A5" />
					<H3>{error}</H3>
					<Link href="/builder"><Button>Terug naar builder</Button></Link>
				</>
			)}

			{!loading && order && order.status === "PAID" && (
				<>
					<Icon name="CircleCheck" size={56} color="#98CEAA" />
					<H2>Betaling gelukt!</H2>
					<P className="text-white/70">Je bestelling #{order.id.slice(0, 8)} is ontvangen.</P>
					<P className="text-white/70">Totaal betaald: €&nbsp;{order.total}</P>
					<Link href="/"><Button>Terug naar home</Button></Link>
				</>
			)}

			{!loading && order && order.status === "PENDING" && (
				<>
					<Icon name="Clock" size={56} color="#f59e0b" />
					<H2>Betaling in behandeling</H2>
					<P className="text-white/70">We wachten op bevestiging van je betaling.</P>
				</>
			)}

			{!loading && order && order.status === "COMPLETED" && (
				<>
					<Icon name="Package" size={56} color="#98CEAA" />
					<H2>Bestelling voltooid!</H2>
					<P className="text-white/70">Je 3D print is onderweg.</P>
					<Link href="/"><Button>Terug naar home</Button></Link>
				</>
			)}
		</section>
	)
}

export default function CheckoutPaymentPage() {
	return <Suspense fallback={null}><CheckoutPaymentContent /></Suspense>
}
