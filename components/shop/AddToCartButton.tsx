"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { ProductPopupModel } from "@/components/shop/ProductPopupModel"
import ProductOptions from "@/components/shop/ProductOptions"
import {useCart} from "@/context/CartContext";
import {ErrorText} from "@/components/ui/Typography";
import {Product} from "@/types/Product";

export default function AddToCartButton({ product }: { product: Product }) {
    const [popupOpen, setPopupOpen] = useState(false)
    const [selectedOption, setSelectedOption] = useState("")
    const [confirmedOption, setConfirmedOption] = useState("")

    const { addItem } = useCart()
    const [error, setError] = useState("")

    const handleAddToCart = () => {
        if (selectedOption === "") {
            setError("Kies een optie")
            return
        }
        setConfirmedOption(selectedOption)

        addItem({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.images[0]?.url || "",
            option: selectedOption,
            product,
        })
        setPopupOpen(true)
    }

    return (
        <div>
            <div className={"mb-15 w-1/4 min-w-50"}>
                <ProductOptions
                    type={product.type}
                    options={product.options}
                    onChangeAction={setSelectedOption}
                />
                {error && <ErrorText className="mt-2">{error}</ErrorText>}
            </div>

            <Button
                className={"mb-25 w-1/3 min-w-60"}
                onClick={handleAddToCart}
            >
                Voeg toe aan winkelmand
            </Button>

            <ProductPopupModel
                isOpen={popupOpen}
                onCloseAction={() => setPopupOpen(false)}
                product={product}
                selectedOption={confirmedOption}
            />
        </div>
    )
}