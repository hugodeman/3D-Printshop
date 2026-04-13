/**
 * POST /api/mollie  (Mollie webhook)
 *
 * Mollie calls this endpoint after a payment status change.
 * Flow:
 *  1. Mollie sends `id` (payment ID) in the POST body
 *  2. We fetch the payment from Mollie to get the latest status
 *  3. We update the Order + Payment status in the database
 *
 * Mollie docs: https://docs.mollie.com/docs/webhooks
 */

import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getMollieClient, isMollieConfigured } from "@/lib/mollie"

export async function POST(request: NextRequest) {
	try {
		if (!isMollieConfigured()) {
			return new NextResponse(null, { status: 200 })
		}

		const body = await request.text()
		// Mollie sends `id=tr_xxxxx` as URL-encoded form data
		const params = new URLSearchParams(body)
		const molliePaymentId = params.get("id")

		if (!molliePaymentId) {
			return NextResponse.json({ error: "Missing payment id" }, { status: 400 })
		}

		// Fetch the latest payment status from Mollie
		const molliePayment = await getMollieClient().payments.get(molliePaymentId)
		const orderId = (molliePayment.metadata as Record<string, string>)?.orderId

		if (!orderId) {
			return NextResponse.json({ error: "No orderId in payment metadata" }, { status: 400 })
		}

		// Map Mollie status to our PaymentStatus enum
		const mollieStatus = molliePayment.status

		if (mollieStatus === "paid") {
			await prisma.$transaction([
				prisma.payment.update({
					where: { orderId },
					data: { status: "PAID", mollieId: molliePaymentId },
				}),
				prisma.order.update({
					where: { id: orderId },
					data: { status: "PAID" },
				}),
			])
		} else if (mollieStatus === "failed" || mollieStatus === "expired" || mollieStatus === "canceled") {
			await prisma.$transaction([
				prisma.payment.update({
					where: { orderId },
					data: { status: "FAILED", mollieId: molliePaymentId },
				}),
			])
		}
		// Other statuses (open, pending, authorized) — no DB update needed

		// Mollie expects a 200 response to confirm receipt
		return new NextResponse(null, { status: 200 })
	} catch (error) {
		console.error("[POST /api/mollie webhook]", error)
		return new NextResponse(null, { status: 500 })
	}
}

