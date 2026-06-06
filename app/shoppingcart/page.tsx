"use client"

import React, {useEffect, useState} from "react";
import Image from "next/image"
import Link from "next/link"
import {useRouter} from "next/navigation";
import {useSession} from "next-auth/react";
import { useCart } from "@/context/CartContext"
import {BackgroundContrast2, BackgroundMain, BackgroundOverlay} from "@/components/ui/Background"
import { H1, H2, H3, P } from "@/components/ui/Typography"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import ProductDetailModal from "@/components/shop/ProductDetailModal";
import BuilderPreviewModal from "@/components/builder/BuilderPreviewModal";
import {Product} from "@/types/Product";
import {BuilderConfig} from "@/types/BuilderConfig";

export default function WinkelmandPage() {
    const router = useRouter()
    const { data: session } = useSession()

    const [selectedProduct, setSelectedProduct] = useState<{
        product: Product
        option?: string
    } | null>(null)

    const [selectedBuilderItem, setSelectedBuilderItem] = useState<BuilderConfig | null>(null)

    const { items, removeItem, updateQuantity, total, note, setNote } = useCart()

    useEffect(() => {
        localStorage.setItem("cart-note", note)
    }, [note])

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true)
    }, [])

    if (!mounted) return null

    function handleCheckout() {
        if (!session) {
            router.push("/auth/login?redirect=/checkout")
        } else {
            router.push("/checkout")
        }
    }

    return (
        <BackgroundMain className="flex flex-col">
            <BackgroundOverlay className="flex flex-col items-center py-10">
                <H1>Winkelmand</H1>
                <Link href="/webshop" className="text-action text-h3 underline mt-2">Ga verder met shoppen</Link>
            </BackgroundOverlay>

            {items.length === 0 ? (
                <div className="flex flex-col items-center gap-4 px-10 mt-10 w-full max-w-4xl mx-auto">
                    <H3>Uw winkelmand is leeg</H3>
                    <Link href="/webshop">
                        <Button>Voeg items toe aan uw winkelmand</Button>
                    </Link>
                </div>
            ): (
                <div className="flex flex-col items-center gap-4 px-10 mt-10 w-full max-w-1/2 mx-auto">
                    <div className="flex flex-row justify-between w-full px-4 mb-2">
                        <H2 className={"pl-50"}>Product</H2>
                        <div className={"flex flex-row gap-20 pr-18"}>
                            <H2 className="text-center pl-30">Aantal</H2>
                            <H2 className="text-right">Prijs</H2>
                        </div>
                    </div>

                    {items.map((item) => (
                        <div key={`${item.id}-${item.option}`} className="w-full min-w-200">
                            <BackgroundContrast2 className={"rounded-2xl p-5 mb-5 w-full flex items-center gap-4 relative"}>
                                <button className="absolute top-4 right-4" onClick={() => removeItem(item.id, item.option ?? "")}>
                                    <Icon name={"Trash2"} size={30} className={"cursor-pointer"} opacity={0.8}/>
                                </button>
                                {item.type === "product" ? (
                                <Image src={item.image} alt={item.title} width={200} height={200} className="rounded-lg object-cover" loading="lazy" />
                                ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={item.image}
                                    alt="Builder item"
                                    className="object-cover rounded-lg w-72 h-auto"
                                />
                                )}

                                <div className="flex-1">
                                    {item.type === "product"? (
                                        <div onClick={() => {
                                            if (!item.product) return

                                            setSelectedProduct({
                                                product: item.product,
                                                option: item.option ?? "",
                                            })
                                        }} className={"cursor-pointer"}>
                                            <H2 className={"mb-10 text-action hover:underline"}>{item.title}</H2>
                                        </div>
                                    ) : (
                                        <div onClick={() => {
                                            if (!item.builderData) return

                                            setSelectedBuilderItem(item.builderData as BuilderConfig)
                                        }} className={"cursor-pointer"}>
                                            <H2 className={"mb-10 text-action hover:underline"}>{item.title}</H2>
                                        </div>
                                    )}

                                    {item.type === "product" ? (
                                        <div>
                                            <H3 className={"pb-1"}>Opmaak:</H3>
                                            <P>{item.option ?? "Standaard"}</P>
                                        </div>
                                    ) : (
                                        <div>
                                            <H3 className={"pb-1"}>Opmaak:</H3>
                                            <div className="flex items-center gap-3">
                                                <P>{item.painted ? "Geverfd" : "Niet geverfd"}</P>
                                            </div>
                                            <P className="mt-2">{item.builderData?.decorations.length ?? 0} decoraties</P>
                                        </div>
                                    )}
                                </div>

                                {item.type === "product" ? (
                                    <select
                                        value={item.quantity}
                                        onChange={(e) => updateQuantity(item.id, item.option ?? "", Number(e.target.value))}
                                        className="rounded-[5px] border input-shadow outline-none transition-colors h-12 px-4 text-p bg-input-normal border-input-normal cursor-pointer"
                                    >
                                        {[1,2,3,4,5].map((n) => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                ): (
                                    <select value={item.quantity}
                                            className="rounded-[5px] border input-shadow outline-none transition-colors h-12 px-4 text-p bg-input-normal border-input-normal"
                                            disabled={true}
                                    >
                                        <option value={1}>1</option>
                                    </select>
                                )}

                                <H3 className="w-20 text-right pr-30 pl-10">€{(item.price * item.quantity).toFixed(2)}</H3>
                            </BackgroundContrast2>
                        </div>
                    ))}

                    <div className="w-full flex gap-4 mt-3 mb-10">
                        <div className={"flex flex-col w-3/7"}>
                            <P>Voeg opmerking/vraag toe:</P>
                            <textarea
                                placeholder="..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="rounded-lg border p-3 w-full min-w-60 h-40 resize-none bg-input-normal border-input-normal outline-none input-shadow mt-2"
                            />
                        </div>
                        <div className="flex flex-col items-end justify-end gap-3 flex-1 mb-4">
                            <div className={"flex flex-row items-center gap-2"}>
                                <H3>Totaal:</H3>
                                <H2 className={"pr-20"}>€{total.toFixed(2)}</H2>
                            </div>
                            <Button className={"w-3/7 min-w-50 mt-3"} onClick={handleCheckout}>
                                Bestellen
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {selectedProduct && (
                <ProductDetailModal
                    isOpen={true}
                    onCloseAction={() => setSelectedProduct(null)}
                    product={selectedProduct.product}
                    selectedOption={selectedProduct.option}
                />
            )}
            {selectedBuilderItem && (
                <BuilderPreviewModal
                    isOpen={true}
                    onCloseAction={() => setSelectedBuilderItem(null)}
                    config={selectedBuilderItem}
                />
            )}
        </BackgroundMain>
    )
}