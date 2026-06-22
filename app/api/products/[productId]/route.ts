/**
 * GET /api/products/[productId]
 *
 * Fetches a single product by its ID, including its images and options.
 *
 */

import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ productId: string }> },
) {
    const { productId } = await params

    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: {
                id: true,
                title: true,
                description: true,
                price: true,
                type: true,
                filament: true,
                dimensions: true,
                deliveryTime: true,
                images: {
                    select: {
                        id: true,
                        url: true,
                    },
                },
                options: {
                    select: {
                        id: true,
                        paintable: true,
                        color: true,
                    },
                },
            }
        })

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 })
        }

        return NextResponse.json({
            id: product.id,
            title: product.title,
            description: product.description,
            price: product.price.toString(),
            type: product.type,
            filament: product.filament,
            dimensions: product.dimensions,
            deliveryTime: product.deliveryTime,
            images: product.images.map(image => ({
                id: image.id,
                url: image.url,
            })),
            options: product.options
                ? {
                    id: product.options.id,
                    paintable: product.options.paintable,
                    color: product.options.color,
                }
                : null,
        })
    } catch (error) {
        console.error("[GET /api/products/[productId]]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ productId: string }> }
) {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { productId } = await params
    const body = await request.json()

    // Afbeeldingen vervangen als meegegeven
    if (body.images && Array.isArray(body.images)) {
        await prisma.productImage.deleteMany({ where: { productId } })
        await prisma.productImage.createMany({
            data: body.images.map((url: string) => ({ productId, url }))
        })
    }

    const updated = await prisma.product.update({
        where: { id: productId },
        data: {
            ...(body.title && { title: body.title }),
            ...(body.description && { description: body.description }),
            ...(body.price !== undefined && { price: body.price }),
            ...(body.type && { type: body.type }),
            ...(body.filament !== undefined && { filament: body.filament }),
            ...(body.dimensions !== undefined && { dimensions: body.dimensions }),
            ...(body.deliveryTime !== undefined && { deliveryTime: body.deliveryTime }),
        },
        include: { images: true, options: true },
    })

    return NextResponse.json(updated)
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ productId: string }> }
) {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { productId } = await params

    await prisma.$transaction([
        prisma.productImage.deleteMany({ where: { productId } }),
        prisma.productOption.deleteMany({ where: { productId } }),
        prisma.product.delete({ where: { id: productId } }),
    ])

    return NextResponse.json({ success: true })
}