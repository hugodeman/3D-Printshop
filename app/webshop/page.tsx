"use client"

import {H1, H2, H3, P} from "@/components/ui/Typography";
import { BackgroundContrast2, BackgroundMain, BackgroundOverlay} from "@/components/ui/Background";
import { Icon } from "@/components/ui/Icon"
import {useEffect, useState} from "react";
import {Button} from "@/components/ui/Button";
import Image from "next/image";
import Link from "next/link"

export default function WebshopPage() {
    const [productData, setProductData] = useState<Array<{
        id: string,
        title: string,
        price: number,
        type: string,
        filament: string,
        dimensions: string,
        description: string,
        deliveryTime: number,
        images: Array<{
            id: string,
            url: string
        }>,
        options: {
            id: string,
            paintable: boolean,
            color: string
        } | null
    }>>([])

    const [productType, setProductType] = useState<"figure" | "practical">("figure")

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch("/api/products")
                if (!response.ok) {
                    throw new Error("Failed to fetch products")
                }
                const data = await response.json()
                setProductData(data)
            } catch (error) {
                console.error("Error fetching products:", error)
            }
        }

        fetchProducts()
    }, [])

    const filteredProducts = productData.filter((product) =>
        product.type === (productType === "figure" ? "FIGURE" : "PRACTICAL")
    )

    return (
        <BackgroundMain>
            <BackgroundOverlay className={"flex justify-center relative"}>
                <div>
                    <H1>Welkom bij de webshop</H1>
                    <H2>Bekijk het assortiment beeldjes of praktische spullen</H2>
                </div>
                <div className="absolute right-25 top-1/2 -translate-y-1/2">
                    <Icon name={"ShoppingCart"} size={40} />
                </div>
            </BackgroundOverlay>
            <div className={"flex justify-center gap-20"}>
                <Button className={"w-64"} isActive={productType === "figure"} onClick={() => setProductType("figure")}>Beeldjes</Button>
                <Button className={"w-64"} isActive={productType === "practical"} onClick={() => setProductType("practical")}>Praktische spullen</Button>
            </div>

            {filteredProducts.map((product) => (
                <Link key={product.id} href={`/webshop/${product.id}`}>
                    <BackgroundContrast2 className={"cursor-pointer flex flex-col items-center gap-4 border-b border-black/10 py-6"}>
                        <div>
                            <Image src={product.images[0]?.url} alt={product.title} width={200} height={200} />
                        </div>
                        <H3>{product.title}</H3>
                        <P>Price: ${product.price}</P>
                    </BackgroundContrast2>
                </Link>
            ))}
        </BackgroundMain>
    )
}