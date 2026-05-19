import { BackgroundMain, BackgroundOverlay } from "@/components/ui/Background"
import prisma from "@/lib/prisma"
import {Icon} from "@/components/ui/Icon";
import ProductDetail from "@/components/shop/ProductDetail"
import Link from "next/link"

type Props = {
    params: Promise<{ productId: string }>
}

export default async function ProductDetailPage({ params }: Props) {
    const { productId } = await params

    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { images: true, options: true }
    })

    if (!product) return <div>Product niet gevonden</div>

    return (
        <BackgroundMain className={"flex flex-col relative"}>
            <div className={"absolute right-25 top-6 z-10"}>
                <Link href="/shoppingcart">
                    <Icon name={"ShoppingCart"} size={50} className="cursor-pointer" />
                </Link>
            </div>
            <BackgroundOverlay className={"mt-25 h-full w-full flex flex-row text-start gap-5"}>
                <ProductDetail
                    product={{
                        ...product,
                        price: Number(product.price),
                    }}
                />
            </BackgroundOverlay>
        </BackgroundMain>
    )
}