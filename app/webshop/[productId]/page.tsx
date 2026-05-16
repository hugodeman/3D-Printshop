import { BackgroundMain, BackgroundOverlay } from "@/components/ui/Background"
import {H2, H3, P} from "@/components/ui/Typography";
import prisma from "@/lib/prisma"
import {Icon} from "@/components/ui/Icon";
import ProductImageSlider from "@/components/shop/ProductImageSlider";
import AddToCartButton from "@/components/shop/AddToCartButton";
import Link from "next/link"

type Props = {
    params: Promise<{ productId: string }>
}

export default async function ProductDetail({ params }: Props) {
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
                <div className={"w-1/3"}>
                    <ProductImageSlider images={product.images} title={product.title}></ProductImageSlider>
                </div>
                <div className={"flex flex-col flex-wrap justify-center w-1/3"}>
                    <H2 className={"pb-15 mt-10"}>{product.title}</H2>
                    <H3 className={"pb-10"}>€ {product.price.toString()}</H3>
                    <P className={"pb-7"}>{product.description}</P>
                    <div className={"flex pb-3 gap-2"}>
                        <P>Verwachte levertijd: </P>
                        <P className={"font-bold"}>{product.deliveryTime} dagen</P>
                    </div>
                    <P className={"pb-3"}>Afmetingen:  {product.dimensions}</P>
                    <P className={"pb-10"}>Filament type: {product.filament}</P>
                    <div className={"mb-5 w-1/4 min-w-50"}>
                        <P>Kies opmaak:</P>
                    </div>
                    <AddToCartButton product={{
                        id: product.id,
                        title: product.title,
                        price: Number(product.price),
                        images: product.images.map(i => i.url),
                        type: product.type,
                        options: product.options
                    }} />
                </div>
            </BackgroundOverlay>
        </BackgroundMain>
    )
}