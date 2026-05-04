import { NextRequest, NextResponse } from "next/server"
import * as fs from "fs"
import prisma from "@/lib/prisma"
import { getPrintFilePath } from "@/lib/builder-print-export"
import {auth} from "@/lib/auth";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ orderId: string }> },
) {
	const { orderId } = await params

	const session = await auth()
	if (session?.user?.role !== "ADMIN") {
	  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
	}

	try {
		// Look up the order's BuilderItem to get the print file name
		const orderItem = await prisma.orderItem.findFirst({
			where: { orderId },
			include: { builderItem: true },
		})

		const printFilename =
			(orderItem?.builderItem as { printFileUrl?: string } | null)?.printFileUrl
			?? `order-${orderId}.3mf`
		if (!printFilename) {
			return NextResponse.json({ error: "Print file not yet generated" }, { status: 404 })
		}

		let filenameToServe = printFilename
		let filepath: string
		try {
			filepath = getPrintFilePath(filenameToServe)
		} catch {
			// Backward compatibility: if 3MF is missing, try STL from older exports.
			filenameToServe = `order-${orderId}.stl`
			filepath = getPrintFilePath(filenameToServe)
		}
		const fileBuffer = fs.readFileSync(filepath)
		const is3mf = filenameToServe.toLowerCase().endsWith(".3mf")

		return new NextResponse(fileBuffer, {
			headers: {
				"Content-Type": is3mf ? "model/3mf" : "model/stl",
				"Content-Disposition": `attachment; filename="${filenameToServe}"`,
				// Prevent caching — the file may be regenerated
				"Cache-Control": "no-store",
			},
		})
	} catch (error) {
		console.error("[GET /api/orders/print-file]", error)
		return NextResponse.json({ error: "File not found" }, { status: 404 })
	}
}

