import { NextRequest, NextResponse } from "next/server"
import * as fs from "fs"
import prisma from "@/lib/prisma"
import { getPrintFilePath } from "@/lib/builder-print-export"
import {auth} from "@/lib/auth";

/**
 * GET /api/orders/[orderId]/print-file
 *
 * Downloads the generated print file (3MF/STL)
 * for a BuilderItem belonging to the given order.
 *
 * Admin-only route.
 *
 * Flow:
 * 1. Validate authenticated admin session
 * 2. Find BuilderItem linked to the order
 * 3. Resolve stored print file path
 * 4. Serve generated 3MF file
 * 5. Fallback to STL export if needed
 *
 * Notes:
 * * Print files are generated after checkout
 * * Files are stored server-side
 * * Cache is disabled because files may be regenerated
 *
 * Security:
 * * Only ADMIN users may access this route
 * * Prevents exposure of internal manufacturing files
 *
 * Response:
 * 200 -> Binary 3MF/STL file
 * 403 -> Forbidden
 * 404 -> File not found
 * 500 -> Internal server error
 */

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

