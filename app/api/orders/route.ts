/**
 * GET /api/orders
 *
 * Returns all paid/completed orders for the authenticated user.
 *
 * Included relations:
 * - Order.items
 * - OrderItem.product (+ images/options)
 * - OrderItem.builderItem
 *
 * Notes:
 * - Prisma Decimal values are converted to numbers before returning JSON
 * - Only orders with status PAID or COMPLETED are returned
 * - Used by the profile page order history and admin page
 *
 * Response:
 * 200 -> Order[]
 * 401 -> Unauthorized
 * 500 -> Internal server error
 */

import { NextResponse, NextRequest } from "next/server"
import { OrderStatus } from "@prisma/client"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createMolliePayment } from "@/lib/mollie"
import { generateAndSavePrintFile } from "@/lib/builder-print-export"

export async function GET() {
    const session = await auth()

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    if (!userId) {
        return NextResponse.json({ error: "No user available for order creation" }, { status: 400 })
    }

    const statuses: OrderStatus[] = ["PAID", "COMPLETED"]

    const where = session.user.role === "ADMIN"
        ? { status: { in: statuses } }
        : { userId: session.user.id, status: { in: statuses } }

    try {
        const orders = await prisma.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        addresses: {
                            select: {firstName: true, lastName: true},
                            take: 1
                        },
                        email: true
                    }
                },
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

        const formattedOrders = orders.map(order => ({
            ...order,
            firstName: order.user?.addresses[0]?.firstName ?? null,
            lastName: order.user?.addresses[0]?.lastName ?? null,
            email: order.user?.email ?? null,
            items: order.items.map(item => ({
                ...item,
                product: item.product
                    ? {
                        ...item.product,
                        price: Number(item.product.price),
                    }
                    : null,
            })),
        }))

        return NextResponse.json(formattedOrders)
    } catch (error) {
        console.error("[GET /api/orders]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

/**
 * POST /api/orders
 *
 * Creates a new order for the authenticated user
 * and initializes the Mollie payment flow.
 *
 * Supported item types:
 * * product -> references an existing webshop Product
 * * builder -> creates a custom BuilderItem from BuilderConfig
 *
 * Flow:
 * 1. Validate authenticated user
 * 2. Calculate total price from cart items
 * 3. Create Order record
 * 4. Create OrderItems
 * 5. For builder items:
 * * create BuilderItem
 * * store BuilderConfig JSON
 * * generate printable 3MF/STL file
 * 6. Create Mollie payment
 * 7. Store Payment record
 * 8. Return checkout URL
 *
 * Notes:
 * * Builder items are generated dynamically from serialized BuilderConfig
 * * Print files are generated server-side after order creation
 * * Prisma Decimal values are stored as strings internally
 *
 * Request body:
 * {
 * items: Array<{
 * type: "product" | "builder"
 * productId?: string
 * quantity: number
 * price: number
 * option?: string
 * builderData?: BuilderConfig
 * image?: string
 * }>
 * note?: string
 * }
 *
 * Response:
 * 200 -> { orderId, checkoutUrl }
 * 401 -> Unauthorized
 * 500 -> Internal server error
 */


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
        },
    })

    await prisma.$transaction(async (tx) => {
        for (const item of items) {
            if (item.type === "product") {
                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price,
                        option: item.option ?? null,
                    },
                })
            }

            if (item.type === "builder") {
                const builder = await tx.builderItem.create({
                    data: {
                        userId: session.user.id,
                        imageUrl: item.image ?? null,
                        deliveryTime: item.builderData?.decorations?.length ?? null,
                        configJson: item.builderData,
                        // Store whether the customer requested the item to be painted
                        painted: typeof item.painted === "boolean" ? item.painted : (item.builderData?.painted ?? false),
                    },
                })

                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        builderItemId: builder.id,
                        quantity: item.quantity,
                        price: item.price,
                    },
                })

                // Genereer printbestand
                try {
                    const printFilename = await generateAndSavePrintFile(order.id, item.builderData)
                    await prisma.builderItem.update({
                        where: { id: builder.id },
                        data: { printFileUrl: printFilename },
                    })
                } catch (exportError) {
                    console.error("[builder-print-export] STL generation failed:", exportError)
                }
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

/**
 *
 * PUT /api/orders
 *
 * Changes order status from PAID to COMPLETED
 */

export async function PUT(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, status } = await request.json()

    const updated = await prisma.order.update({
        where: { id },
        data: { status },
    })

    return NextResponse.json(updated)
}