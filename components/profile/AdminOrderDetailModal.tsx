"use client"

import Image from "next/image";
import {Icon} from "@/components/ui/Icon";
import {BackgroundContrast1} from "@/components/ui/Background";
import {H2, H3, P} from "@/components/ui/Typography";
import {Input} from "@/components/ui/Input";
import {Order} from "@/types/Order";
import {BuilderConfig} from "@/types/BuilderConfig";
import Link from "next/link";
import {Button} from "@/components/ui/Button";
import ProductDetailModal from "@/components/shop/ProductDetailModal";
import BuilderPreviewModal from "@/components/builder/BuilderPreviewModal";
import React, {useState} from "react";
import {Product} from "@/types/Product";

type Props = {
    isOpen: boolean
    onCloseAction: () => void
    order: Order
}

export default function AdminOrderDetailModal({ isOpen, onCloseAction, order }: Props) {
    const [selectedProduct, setSelectedProduct] = useState<{ product: Product; option: string } | null>(null)
    const [selectedBuilderItem, setSelectedBuilderItem] = useState<BuilderConfig | null>(null)

    if (!isOpen) return null

    const mailBody = `Beste ${order.firstName},
    
    Als antwoord op uw vraag: 
    ${order.note}
    
    Het antwoord:
    
    
    Met vriendelijke groet,
    
    HoekvanNoek`;

    const printFileDownloadUrl = `/api/orders/${order.id}/print-file`

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onCloseAction}
        >
            <div className="bg-white rounded-4xl p-8 w-full max-w-300 relative overflow-y-auto max-h-[90vh]">
                <div onClick={(e) => e.stopPropagation()}>
                    <button className="absolute top-4 right-4" onClick={onCloseAction}>
                        <Icon name="X" size={40} className="cursor-pointer" color="black" />
                    </button>
                    <div className={"flex justify-between mr-50"}>
                        <div>
                            <H2 className="mb-2 text-contrast">Bestelling #{order.id.slice(-6).toUpperCase()}</H2>
                            <H3 className="mb-6 text-contrast">{new Date(order.createdAt).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" })}</H3>
                        </div>
                        <div>
                            <H2 className={"text-contrast mb-2"}>Besteller: {order.firstName} {order.lastName}</H2>
                            <div className={"flex gap-4"}>
                                <Icon name={"Mail"} color={"black"} size={30} />
                                <a href={`mailto:${order.email}?subject=Bestelling - #${order.id.slice(-6).toUpperCase()}&body=${encodeURIComponent(mailBody)}`} className="text-action-contrast hover:underline text-center">
                                    Stuur gebruiken een mail
                                </a>
                            </div>
                        </div>
                    </div>

                    <BackgroundContrast1 className="p-6 rounded-2xl">
                        {order.items.map(item => (
                            <div key={item.id} className="flex items-center gap-4 pb-5 border-b border-black/20">
                                {item.product && (
                                    <div className="flex gap-4">
                                        <Image src={item.product.images[0]?.url || ""} alt={item.product.title} width={200} height={200} className="rounded-lg object-cover mt-5" />
                                        <div className="flex flex-col justify-between">
                                            <H2 className="text-contrast mt-11">{item.product.title}</H2>
                                            <P className="text-contrast py-3">Aantal: {item.quantity}</P>
                                            <P className="text-contrast pt-10 pb-4">Opmaak: {item.option}</P>
                                            <P className="text-contrast pb-5">Maaktijd: {item.product.deliveryTime} uur</P>
                                        </div>
                                    </div>
                                )}
                                {item.builderItem && (
                                    <div className="flex gap-4">
                                        {item.builderItem.imageUrl && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={item.builderItem.imageUrl} alt="Builder item" className="object-cover rounded-lg w-72 h-auto mt-5" />
                                        )}
                                        <div className="flex flex-col justify-between">
                                            <div onClick={() => {
                                                // const config = item.builderItem?.configJson as BuilderConfig
                                                // if (config) onBuilderPreviewAction(config)
                                                setSelectedBuilderItem(item.builderItem?.configJson as BuilderConfig)
                                            }} className="cursor-pointer">
                                                <H2 className="mt-11 text-action-contrast hover:underline">Custom Builder Item</H2>
                                            </div>
                                            <P className="text-contrast py-3">Aantal: {item.quantity}</P>
                                            <P className="text-contrast pt-10 pb-4">Opmaak: {item.builderItem.painted ? "Geverfd" : "Niet geverfd"}</P>
                                            <P className="text-contrast pb-5 ">Maaktijd: {item.builderItem.deliveryTime || "1"} uur</P>
                                        </div>
                                        <div className={"flex items-center ml-20"}>
                                            <Link href={printFileDownloadUrl} target="_blank" rel="noreferrer">
                                                <Button variant="secondary" className="min-w-56 flex gap-3 py-4">
                                                    <Icon name="Download" size={25} color="#98CEAA" />
                                                    <H3 className={"text-emerald-600"}>Download printbestand</H3>
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                )}
                                <H3 className="ml-auto pr-6 text-contrast">€{item.price}</H3>
                            </div>
                        ))}

                        <div className="flex flex-row justify-between mt-4">
                            <div className="w-1/2">
                                <H3 className="mt-5 mb-2 text-contrast">Vragen/opmerkingen:</H3>
                                <Input readOnly={true} inputSize="lg" type="text" value={order.note || ""} />
                            </div>
                            <div className="flex flex-row items-center gap-2 justify-end pt-4 pr-3 text-center">
                                <H3 className={"text-contrast"}>Totaal:</H3>
                                <H2 className={"text-contrast"}>€{order.total}</H2>
                            </div>
                        </div>
                    </BackgroundContrast1>
                </div>
            </div>
            {selectedProduct && (
                <ProductDetailModal isOpen={true} onCloseAction={() => setSelectedProduct(null)}
                                    product={{ ...selectedProduct.product, price: Number(selectedProduct.product.price) }}
                                    selectedOption={selectedProduct.option}
                />
            )}
            {selectedBuilderItem && (
                <BuilderPreviewModal isOpen={true} onCloseAction={() => setSelectedBuilderItem(null)} config={selectedBuilderItem} />
            )}
        </div>
    )
}