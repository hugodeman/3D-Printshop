import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { mkdir, writeFile } from "fs/promises"
import { join, extname } from "path"
import { NextRequest, NextResponse } from "next/server"

const ALLOWED_MODEL_EXTENSIONS = [".stl", ".obj", ".3mf"]
const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
]

const MAX_MODEL_SIZE = 32 * 1024 * 1024 // 32MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB

export async function GET() {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const where = session.user.role === "ADMIN"?
            {}:
            {userId: session.user.id}

        const quotes = await prisma.quote.findMany({
            where,
            include: {
                files: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        return NextResponse.json(quotes)
    } catch (error) {
        console.error(error)

        return NextResponse.json(
            { error: "Failed to fetch quotes" },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()

        const firstName = formData.get("firstName")?.toString().trim()
        const lastName = formData.get("lastName")?.toString().trim()
        const email = formData.get("email")?.toString().trim()
        const description = formData.get("description")?.toString().trim()
        const question = formData.get("question")?.toString().trim()

        if (!firstName) {
            return NextResponse.json(
                { error: "First name is required" },
                { status: 400 }
            )
        }

        if (!lastName) {
            return NextResponse.json(
                { error: "Last name is required" },
                { status: 400 }
            )
        }

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            )
        }

        if (!description) {
            return NextResponse.json(
                { error: "Description is required" },
                { status: 400 }
            )
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { error: "Invalid email address" },
                { status: 400 }
            )
        }

        const modelFile = formData.get("modelFile") as File | null
        const photoFiles = formData
            .getAll("photoFiles")
            .filter((file): file is File => file instanceof File)

        // -------------------------------------------------------------------------
        // Validate model
        // -------------------------------------------------------------------------

        if (modelFile && modelFile.size > 0) {
            const extension = extname(modelFile.name).toLowerCase()

            if (!ALLOWED_MODEL_EXTENSIONS.includes(extension)) {
                return NextResponse.json(
                    { error: "Invalid model file type" },
                    { status: 400 }
                )
            }

            if (modelFile.size > MAX_MODEL_SIZE) {
                return NextResponse.json(
                    { error: "Model exceeds 32MB" },
                    { status: 400 }
                )
            }
        }

        // -------------------------------------------------------------------------
        // Validate images
        // -------------------------------------------------------------------------

        for (const image of photoFiles) {
            if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
                return NextResponse.json(
                    { error: "Invalid image type" },
                    { status: 400 }
                )
            }

            if (image.size > MAX_IMAGE_SIZE) {
                return NextResponse.json(
                    { error: "Image exceeds 10MB" },
                    { status: 400 }
                )
            }
        }

        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // -------------------------------------------------------------------------
        // Create quote
        // -------------------------------------------------------------------------

        const quote = await prisma.quote.create({
            data: {
                userId: session.user.id,
                description,
                question: question || null,
                firstName,
                lastName,
                email,
                status: "PENDING",
            },
        })

        // -------------------------------------------------------------------------
        // Create upload directory
        // -------------------------------------------------------------------------

        const uploadDir = join(
            process.cwd(),
            "private",
            "quotes",
            quote.id
        )

        await mkdir(uploadDir, {
            recursive: true,
        })

        const filesToCreate: {
            url: string
            filename: string
            mimeType: string
            size: number
            type: string
        }[] = []

        // -------------------------------------------------------------------------
        // Save model
        // -------------------------------------------------------------------------

        if (modelFile && modelFile.size > 0) {
            const bytes = await modelFile.arrayBuffer()
            const buffer = Buffer.from(bytes)

            const filename = modelFile.name

            await writeFile(join(uploadDir, filename), buffer)

            filesToCreate.push({
                url: `/private/quotes/${quote.id}/${filename}`,
                filename,
                mimeType: modelFile.type,
                size: modelFile.size,
                type: "model",
            })
        }

        // -------------------------------------------------------------------------
        // Save images
        // -------------------------------------------------------------------------

        for (const image of photoFiles) {
            const bytes = await image.arrayBuffer()
            const buffer = Buffer.from(bytes)

            const filename = image.name

            await writeFile(join(uploadDir, filename), buffer)

            filesToCreate.push({
                url: `/private/quotes/${quote.id}/${filename}`,
                filename,
                mimeType: image.type,
                size: image.size,
                type: "image",
            })
        }

        // -------------------------------------------------------------------------
        // Create QuoteFile records
        // -------------------------------------------------------------------------

        if (filesToCreate.length > 0) {
            await prisma.quoteFile.createMany({
                data: filesToCreate.map((file) => ({
                    quoteId: quote.id,
                    url: file.url,
                    filename: file.filename,
                    mimeType: file.mimeType,
                    size: file.size,
                    type: file.type,
                })),
            })
        }

        const completeQuote = await prisma.quote.findUnique({
            where: {
                id: quote.id,
            },
            include: {
                files: true,
            },
        })

        return NextResponse.json(completeQuote, {
            status: 201,
        })
    } catch (error) {
        console.error(error)

        return NextResponse.json(
            {
                error: "Failed to create quote",
            },
            {
                status: 500,
            }
        )
    }
}

export async function PATCH(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, status, accepted } = await request.json()

    const updated = await prisma.quote.update({
        where: { id },
        data: {
            ...(status !== undefined && { status }),
            ...(accepted !== undefined && { accepted }),
        },
    })

    return NextResponse.json(updated)
}