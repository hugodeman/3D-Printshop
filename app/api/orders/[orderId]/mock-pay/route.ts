import { NextRequest, NextResponse } from "next/server"

import prisma from "@/lib/prisma"
import { isMollieConfigured } from "@/lib/mollie"

// Dev-only helper: allows simulating a successful payment without Mollie account/keys.
export async function POST(
	_request: NextRequest,
	{ params }: { params: Promise<{ orderId: string }> },
) {
	if (process.env.NODE_ENV === "production") {
		return NextResponse.json({ error: "Not available in production" }, { status: 403 })
	}

	const { orderId } = await params

	try {
		const payment = await prisma.payment.findUnique({ where: { orderId } })
		if (!payment) {
			return NextResponse.json({ error: "Payment not found" }, { status: 404 })
		}

		// Block this endpoint when real Mollie is configured and active.
		if (isMollieConfigured() && !payment.mollieId.startsWith("mock-")) {
			return NextResponse.json({ error: "Mock payment disabled when Mollie is configured" }, { status: 400 })
		}

		await prisma.$transaction([
			prisma.payment.update({
				where: { orderId },
				data: { status: "PAID" },
			}),
			prisma.order.update({
				where: { id: orderId },
				data: { status: "PAID" },
			}),
		])

		return NextResponse.json({ ok: true })
	} catch (error) {
		console.error("[POST /api/orders/[orderId]/mock-pay]", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}

