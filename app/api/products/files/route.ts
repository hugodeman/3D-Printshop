import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll("images") as File[]

    const urls: string[] = []

    for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer())
        const filename = `${Date.now()}-${file.name}`
        const dir = path.join(process.cwd(), "public", "products")

        await mkdir(dir, { recursive: true })
        await writeFile(path.join(dir, filename), buffer)

        urls.push(`/products/${filename}`)
    }

    return NextResponse.json({ urls })
}