"use client"

import {useRouter} from "next/navigation";
import {Icon} from "@/components/ui/Icon";
import { H2, H3, P } from "@/components/ui/Typography"
import ProductImageSlider from "@/components/shop/ProductImageSlider"
import AddToCartButton from "@/components/shop/AddToCartButton"
import { Product } from "@/types/Product"

type Props = {
    product: Product
    selectedOption?: string
    mode?: "page" | "modal"
    iconColor?: string
}

export default function ProductDetail({ product, selectedOption, mode = "page", iconColor }: Props) {
    const router = useRouter()
    const textClass = mode === "modal" ? "text-contrast" : ""

    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/products/${product.id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    product,
                })
            })
            if (res.status === 200) {
                router.push("/webshop")
            }
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className={`flex ${mode === "modal" ? "flex-row gap-20" : "flex-row gap-20 mr-10"}`}>
            <div className={mode === "modal" ? "shrink-0 w-1/2" : "w-full"}>
                <ProductImageSlider images={product.images} title={product.title} iconColor={iconColor}/>
            </div>

            <div className="flex flex-col justify-center gap-3">
                <H2 className={`pb-5 ${textClass}`}>{product.title}</H2>
                <H3 className={`pb-3 ${textClass}`}>€ {product.price.toFixed(2)}</H3>
                <P className={`pb-2 ${textClass}`}>{product.description}</P>
                <div className={"flex pb-3 gap-2"}>
                    <P className={`${textClass}`}>Verwachte levertijd: </P>
                    <P className={`font-bold ${textClass}`}>{product.deliveryTime} dagen</P>
                </div>
                <P className={`pb-1 ${textClass}`}>Filament type: {product.filament}</P>
                <P className={`pb-3 ${textClass}`}>Afmetingen: {product.dimensions}</P>

                {selectedOption ? (
                    <div>
                        <P className={textClass}>Opmaak:</P>
                        <P className={`font-bold ${textClass}`}>{selectedOption}</P>
                    </div>
                ) : (
                    <AddToCartButton product={product} />
                )}
            </div>
            <div className={"absolute right-50 cursor-pointer"} onClick={handleDelete}>
                <Icon name={"Trash2"} size={40} color="#FCA5A5" />
            </div>
        </div>
    )
}