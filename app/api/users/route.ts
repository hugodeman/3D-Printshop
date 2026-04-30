import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            email: true,
            addresses: {
                take: 1,
            }
        }
    })

    return NextResponse.json({
        email: user?.email,
        address: user?.addresses[0] ?? null,
    })
}

export async function PUT(req: Request) {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })

    const body = await req.json()

    if (body.type === "address") {
        const { firstName, lastName, country, postal, street, addition, city } = body
        const existing = await prisma.address.findFirst({ where: { userId: session.user.id } })

        if (existing) {
            await prisma.address.update({ where: { id: existing.id }, data: { firstName, lastName, country, postal, street, addition, city } })
        } else {
            await prisma.address.create({ data: { userId: session.user.id, firstName, lastName, country, postal, street, addition, city } })
        }
    }

    // Credentials opslaan
    if (body.type === "credentials") {
        const updateData: { email?: string; password?: string } = {}

        if (body.email) {
            // Check of email al in gebruik is
            const emailTaken = await prisma.user.findFirst({
                where: { email: body.email, NOT: { id: session.user.id } }
            })
            if (emailTaken) return NextResponse.json({ error: "Email al in gebruik" }, { status: 400 })
            updateData.email = body.email
        }

        if (body.password) {
            const bcrypt = await import("bcryptjs")
            updateData.password = await bcrypt.hash(body.password, 12)
        }

        await prisma.user.update({ where: { id: session.user.id }, data: updateData })
    }

    return NextResponse.json({ success: true })
}