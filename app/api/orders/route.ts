/**
 * GET /api/orders
 * Returns all orders for the currently logged-in user,
 * including order items with their product or builderItem.
 */

import { NextResponse, NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createMolliePayment } from "@/lib/mollie"

export async function GET() {
    const session = await auth()

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    if (!userId) {
        return NextResponse.json({ error: "No user available for order creation" }, { status: 400 })
    }

    try {
        const orders = await prisma.order.findMany({
            where: {
                userId: session.user.id,
                status: { in: ["PAID", "COMPLETED"] },
            },
            orderBy: { createdAt: "desc" },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                images: true,
                                options: true,
                            },
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

export async function POST(request: NextRequest) {
    const session = await auth()

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { items, note } = body

    const total = items.reduce((sum: number, item: { price: number, quantity: number }) =>
        sum + item.price * item.quantity, 0
    ).toFixed(2)

    const order = await prisma.order.create({
        data: {
            userId: session.user.id,
            total,
            note,
            items: {
                create: items.map((item: { productId: string, quantity: number, price: number }) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                }))
            }
        }
    })

    const description = `Webshop bestelling – ${items.length} product(en)`
    const { mollieId, checkoutUrl } = await createMolliePayment(order.id, total, description)

    await prisma.payment.create({
        data: {
            orderId: order.id,
            mollieId,
        }
    })

    return NextResponse.json({ orderId: order.id, checkoutUrl })
}