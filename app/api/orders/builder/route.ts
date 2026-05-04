/**
 * POST /api/orders/builder
 *
 * Creates a builder order:
 *  1. Stores BuilderItem with configJson + preview image
 *  2. Calculates price from platform size + decoration count
 *  3. Creates Order + OrderItem in the database
 *  4. Generates a placeholder STL print file (stored privately)
 *  5. Creates a Mollie payment and returns the checkout URL
 *
 * TODO: Replace hardcoded `userId` with the actual session user ID once
 *       NextAuth is configured.  Use `getServerSession()` from next-auth.
 */

import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createMolliePayment } from "@/lib/mollie"
import { generateAndSavePrintFile } from "@/lib/builder-print-export"
import type { BuilderCheckoutDraft } from "@/lib/builder-checkout-draft"
import {auth} from "@/lib/auth";

// Pricing
const PLATFORM_PRICE: Record<number, number> = {
	10: 20.00,  // M
	15: 25.00,  // L
	20: 30.00,  // XL
}
const DECORATION_PRICE = 5.00 // per piece

function calculateTotal(draft: BuilderCheckoutDraft): string {
	const base = PLATFORM_PRICE[draft.platformSize] ?? 20.00
	const decos = draft.decorations.length * DECORATION_PRICE
	return (base + decos).toFixed(2)
}

export async function POST(request: NextRequest) {
	try {
		const draft = (await request.json()) as BuilderCheckoutDraft

		const session = await auth()

		if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		const userId = session.user.id

		if (!userId) {
			return NextResponse.json({ error: "No user available for order creation" }, { status: 400 })
		}

		const total = calculateTotal(draft)

		const builderItem = await prisma.builderItem.create({
			data: {
				userId,
				imageUrl: draft.previewImage ?? null,
				configJson: draft as object,
			},
		})

		const order = await prisma.order.create({
			data: {
				userId,
				total,
				items: {
					create: {
						builderItemId: builderItem.id,
						quantity: 1,
						price: total,
					},
				},
			},
		})

		// ── Print file (STL) ──────────────────────────────────────────────────
		// Generates a placeholder STL from the config and stores it privately.
		// The admin can download it via GET /api/orders/[orderId]/print-file.
		try {
			const printFilename = await generateAndSavePrintFile(order.id, draft)
			await prisma.$executeRaw`
				UPDATE "BuilderItem"
				SET "printFileUrl" = ${printFilename}
				WHERE "id" = ${builderItem.id}
			`
		} catch (exportError) {
			// Non-fatal: order still gets created even if STL export fails.
			// The file can be regenerated later by the admin.
			console.error("[builder-print-export] STL generation failed:", exportError)
		}

		// ── Mollie payment ────────────────────────────────────────────────────
		const description = `3D Print Builder – ${draft.platformName} + ${draft.decorations.length} decoraties`
		const { mollieId, checkoutUrl } = await createMolliePayment(order.id, total, description)

		await prisma.payment.create({
			data: {
				orderId: order.id,
				mollieId,
			},
		})

		return NextResponse.json({ orderId: order.id, checkoutUrl })
	} catch (error) {
		console.error("[POST /api/orders/builder]", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}

