import { BackgroundMain, BackgroundOverlay } from "@/components/ui/Background"
import prisma from "@/lib/prisma"

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
        <BackgroundMain>
            <BackgroundOverlay>
                <div>{product.title}</div>
                <div>hoi</div>
            </BackgroundOverlay>
        </BackgroundMain>
    )
}