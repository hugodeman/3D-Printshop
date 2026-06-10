/**
 *   GET /api/quotes/[quoteId]
 *
 *   Fetches a single quote by its id
 *
 */

import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ quoteId: string }> },
) {
    const { quoteId } = await params

    try {
        const quote = await prisma.quote.findUnique({
            where: { id: quoteId },
            select: {
                id: true,
                description: true,
                question: true,
                firstName: true,
                lastName: true,
                email: true,
                files: {
                    select:{
                        id: true,
                        filename: true,
                        url: true,
                        type: true,
                    }
                }
            }
        })

        if (!quote) {
            return NextResponse.json({ error: "Quote not found" }, { status: 404 })
        }

        return NextResponse.json({
            id: quote.id,

        })
    } catch (error) {
        console.error("[GET /api/quotes/[quoteId]]", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}