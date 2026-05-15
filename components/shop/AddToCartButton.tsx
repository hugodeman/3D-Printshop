"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { ProductPopupModel } from "@/components/shop/ProductPopupModel"
import ProductOptions from "@/components/shop/ProductOptions"

type Props = {
    product: {
        id: string
        title: string
        price: number
        images: string[]
        type: string
        options: {
            paintable: boolean | null
            color: string | null
        } | null
    }
}

export default function AddToCartButton({ product }: Props) {
    const [popupOpen, setPopupOpen] = useState(false)
    const [selectedOption, setSelectedOption] = useState("")

    return (
        <div>
            <div className={"mb-15 w-1/4 min-w-50"}>
                <ProductOptions
                    type={product.type}
                    options={product.options}
                    onChangeAction={setSelectedOption}
                />
            </div>

            <Button
                className={"mb-25 w-1/3 min-w-60"}
                onClick={() => setPopupOpen(true)}
            >
                Voeg toe aan winkelmand
            </Button>

            <ProductPopupModel
                isOpen={popupOpen}
                onCloseAction={() => setPopupOpen(false)}
                product={{
                    ...product,
                    options: selectedOption ? [selectedOption] : []
                }}
            />
        </div>
    )
}