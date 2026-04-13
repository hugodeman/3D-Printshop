/**
 * GET /api/orders/[orderId]
 *
 * Returns the public order status (id, status, total) for the payment page.
 * Used to poll after Mollie redirect to check if webhook already updated the status.
 */

import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ orderId: string }> },
) {
	const { orderId } = await params

	try {
		const order = await prisma.order.findUnique({
			where: { id: orderId },
			select: { id: true, status: true, total: true },
		})

		if (!order) {
			return NextResponse.json({ error: "Order not found" }, { status: 404 })
		}

		return NextResponse.json({
			id: order.id,
			status: order.status,
			total: order.total.toString(),
		})
	} catch (error) {
		console.error("[GET /api/orders/[orderId]]", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}

