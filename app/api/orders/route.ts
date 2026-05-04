/**
 * GET /api/orders
 * Returns all orders for the currently logged-in user,
 * including order items with their product or builderItem.
 */

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
    const session = await auth()

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const orders = await prisma.order.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            include: {
                items: {
                    include: {
                        product: {
                            include: { images: true },
                        },
                        builderItem: true,
                    },
                },
            },
        })

        return NextResponse.json(orders)
    } catch (error) {
        console.error("[GET /api/orders]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}