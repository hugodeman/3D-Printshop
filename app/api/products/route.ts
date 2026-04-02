import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

const PRODUCT_TYPES = ["FIGURE", "PRACTICAL"] as const;

type ProductType = (typeof PRODUCT_TYPES)[number];

function isProductType(value: unknown): value is ProductType {
  return typeof value === "string" && PRODUCT_TYPES.includes(value as ProductType);
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { images: true, options: true },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    if (typeof body.description !== "string" || !body.description.trim()) {
      return NextResponse.json({ error: "description is required" }, { status: 400 });
    }

    if (!isProductType(body.type)) {
      return NextResponse.json({ error: "type must be FIGURE or PRACTICAL" }, { status: 400 });
    }

    if (body.price === undefined || body.price === null || body.price === "") {
      return NextResponse.json({ error: "price is required" }, { status: 400 });
    }

    const numericPrice = Number(body.price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return NextResponse.json({ error: "price must be a non-negative number" }, { status: 400 });
    }

    let deliveryTime: number | undefined;
    if (body.deliveryTime !== undefined && body.deliveryTime !== null && body.deliveryTime !== "") {
      const parsedDeliveryTime = Number(body.deliveryTime);
      if (!Number.isInteger(parsedDeliveryTime) || parsedDeliveryTime < 0) {
        return NextResponse.json({ error: "deliveryTime must be a non-negative integer" }, { status: 400 });
      }
      deliveryTime = parsedDeliveryTime;
    }

    const imagesInput = Array.isArray(body.images) ? body.images : [];
    const imageCreates: Array<{ url: string }> = imagesInput
      .map((image: unknown) => {
        if (typeof image === "string") {
          return { url: image };
        }
        if (image && typeof image === "object" && "url" in image && typeof image.url === "string") {
          return { url: image.url };
        }
        return null;
      })
      .filter((image: { url: string } | null): image is { url: string } => Boolean(image?.url?.trim()))
      .map((image: { url: string }) => ({ url: image.url.trim() }));

    const optionsInput =
      body.options && typeof body.options === "object"
        ? {
            paintable:
              typeof body.options.paintable === "boolean" ? body.options.paintable : undefined,
            color: typeof body.options.color === "string" ? body.options.color : undefined,
          }
        : null;

    const hasOptions = Boolean(
      optionsInput && (optionsInput.paintable !== undefined || optionsInput.color !== undefined)
    );

    const productData = {
      title: body.title.trim(),
      description: body.description.trim(),
      price: numericPrice,
      type: body.type,
      filament: typeof body.filament === "string" ? body.filament : undefined,
      dimensions: typeof body.dimensions === "string" ? body.dimensions : undefined,
      deliveryTime,
      createdBy: body.createdById
        ? {
            connect: {
              id: String(body.createdById),
            },
          }
        : undefined,
      images: imageCreates.length > 0 ? { create: imageCreates } : undefined,
      options: hasOptions ? { create: optionsInput! } : undefined,
    };

    const product = await prisma.product.create({
      data: productData,
      include: { images: true, options: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}