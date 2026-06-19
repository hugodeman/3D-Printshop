import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { readFile } from "fs/promises"
import path from "path"

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ quoteId: string; fileId: string }> }
) {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileId } = await params

    const file = await prisma.quoteFile.findUnique({
        where: { id: fileId },
    })

    if (!file) {
        return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const filePath = path.join(process.cwd(), file.url)
    const fileBuffer = await readFile(filePath)

    return new NextResponse(fileBuffer, {
        headers: {
            "Content-Type": file.mimeType,
            "Content-Disposition": `attachment; filename="${file.filename}"`,
        },
    })
}