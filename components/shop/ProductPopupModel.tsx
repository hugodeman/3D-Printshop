"use client"

import {BackgroundContrast1} from "@/components/ui/Background";
import {H2, H3} from "@/components/ui/Typography";
import {Icon} from "@/components/ui/Icon";
import {Button} from "@/components/ui/Button";
import Image from "next/image"

type ProductPopupModel = {
    isOpen: boolean
    onCloseAction: () => void
    product: {
        id: string
        title: string
        price: number
        images: string[]
        options: string[]
    }
}

export function ProductPopupModel({ isOpen, onCloseAction, product }: ProductPopupModel) {
    if (!isOpen) return null

    return (
        <BackgroundContrast1 className="fixed top-27 right-10 z-50 rounded-2xl shadow-xl p-5 w-72 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-[black]/30 pb-3">
                <H2 className="text-contrast">Product toegevoegd</H2>
                <Icon name={"X"} size={30} onClick={onCloseAction} className="cursor-pointer" color={"black"} />
            </div>

            <div className="flex gap-5 items-center mb-5 mt-2">
                <Image
                    src={product.images[0] || ""}
                    alt={product.title}
                    width={70}
                    height={70}
                    className="rounded-lg object-cover"
                />
                <div className="flex flex-col gap-1">
                    <H3 className="text-sm text-contrast">{product.title}</H3>
                    <H3 className="text-sm text-contrast">€ {product.price}</H3>
                    {product.options.length > 0 && <H3 className="text-sm text-contrast">{product.options[0]}</H3>}
                </div>
            </div>

            <Button variant={"primary"} isActive={true} className="w-full">
                Ga naar winkelmand
            </Button>
        </BackgroundContrast1>
    )
}