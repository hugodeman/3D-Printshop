"use client"

import { BackgroundContrast1 } from "@/components/ui/Background"
import { Icon } from "@/components/ui/Icon"
import ProductDetail from "@/components/shop/ProductDetail"
import {Product} from "@/types/Product";

type Props = {
    isOpen: boolean
    onCloseAction: () => void
    product: Product
    selectedOption?: string
}

export default function ProductDetailModal({ isOpen, onCloseAction, product, selectedOption }: Props) {
    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onCloseAction}
        >
            <BackgroundContrast1 className="rounded-4xl p-8 w-full max-w-300 relative" >
                <div onClick={(e) => e.stopPropagation()}>
                    <button className="absolute top-4 right-4" onClick={onCloseAction}>
                        <Icon name="X" size={40} className="cursor-pointer" color={"black"}/>
                    </button>

                    <ProductDetail
                        product={product}
                        selectedOption={selectedOption}
                        mode="modal"
                        iconColor="black"
                    />
                </div>
            </BackgroundContrast1>
        </div>
    )
}