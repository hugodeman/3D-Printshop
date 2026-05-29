"use client"

import Image from "next/image";
import Link from "next/link"
import {H1, H2, H3} from "@/components/ui/Typography";
import { BackgroundContrast2, BackgroundMain, BackgroundOverlay} from "@/components/ui/Background";
import { Icon } from "@/components/ui/Icon"
import {useEffect, useState} from "react";
import {Button} from "@/components/ui/Button";
import {Product} from "@/types/Product";

export default function WebshopPage() {
    const [productData, setProductData] = useState<Product[]>([])

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
        <BackgroundMain className={"relative"}>
            <BackgroundOverlay className={"flex justify-center"}>
                <div>
                    <H1>Welkom bij de webshop</H1>
                    <H2 className={"mt-5"}>Bekijk het assortiment beeldjes of praktische spullen</H2>
                </div>
                <div className="absolute right-25 top-6 z-10 cursor-pointer">
                    <Link href="/shoppingcart">
                        <Icon name={"ShoppingCart"} size={50} />
                    </Link>
                </div>
            </BackgroundOverlay>
            <div className={"flex justify-center gap-20 my-10 pb-5"}>
                <Button className={"w-64"} isActive={productType === "figure"} onClick={() => setProductType("figure")}>Beeldjes</Button>
                <Button className={"w-64"} isActive={productType === "practical"} onClick={() => setProductType("practical")}>Praktische spullen</Button>
            </div>

            <div className={"grid grid-cols-3 gap-15 px-130 justify-center items-center mb-20"}>
                {filteredProducts.map((product) => (
                    <Link key={product.id} href={`/webshop/${product.id}`} className={"flex justify-center"}>
                        <BackgroundContrast2 className={"rounded-2xl cursor-pointer flex flex-col gap-4 p-6 min-w-70 w-full mb-5 transition-transform duration-200 hover:scale-110 hover:shadow-xl"}>
                            <div className={"flex justify-center"}>
                                <Image src={product.images[0]?.url} alt={product.title} width={200} height={200} loading={"lazy"} />
                            </div>
                            <div className={"mb-5 pl-5"}>
                                <H3 className={"mb-2"}>{product.title}</H3>
                                <H3>€ {product.price}</H3>
                            </div>
                        </BackgroundContrast2>
                    </Link>
                ))}
            </div>
        </BackgroundMain>
    )
}