import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
    try {
        const { email, password, firstName, lastName, country, street, addition, postal, city } = await req.json()

        const normalizedEmail = email.toLowerCase().trim()

        const existing = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        })
        if (existing) {
            return NextResponse.json({ error: "Email is al in gebruik" }, { status: 409 })
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                password: hashedPassword,
                addresses: firstName ? {
                    create: { firstName, lastName, country, street, addition, postal, city }
                } : undefined,
            },
        })

        return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
    } catch (error) {
        console.error("Register error:", error)
        return NextResponse.json({ error: "Er is iets misgegaan" }, { status: 500 })
    }
}