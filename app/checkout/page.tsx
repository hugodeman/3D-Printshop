"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import {useRouter} from "next/navigation";
import {useSession} from "next-auth/react";
import { BackgroundMain, BackgroundContrast1, BackgroundContrast2, BackgroundOverlay } from "@/components/ui/Background"
import {ErrorText, H1, H2, H3, P} from "@/components/ui/Typography"
import { Button } from "@/components/ui/Button"
import { AddressForm, AddressData, AddressErrors } from "@/components/forms/AddressForm"
import { Icon } from "@/components/ui/Icon"
import { useCart } from "@/context/CartContext"
import Link from "next/link";

const SHIPPING_COST = 7

export default function CheckoutPage() {
    const router = useRouter()
    const { data: session, status } = useSession()

    const { items, total, note } = useCart()
    const [overviewOpen, setOverviewOpen] = useState(false)

    const [addressData, setAddressData] = useState<AddressData>({
        country: "", firstName: "", lastName: "",
        street: "", addition: "", postal: "", city: "",
    })
    const [addressErrors, setAddressErrors] = useState<AddressErrors>({})
    const [paymentMethod, setPaymentMethod] = useState<"ideal" | "paypal">("ideal")
    const [isLoading, setIsLoading] = useState(false)
    const [conditionsAccepted, setConditionsAccepted] = useState(false)
    const [checklistErrors, setChecklistErrors] = useState("")
    const hasBuilderItems = items.some(i => i.type === "builder")
    const [builderItemsAccepted, setBuilderItemsAccepted] = useState(false)
    const [builderItemErrors, setBuilderItemErrors] = useState("")

    useEffect(() => {
        const fetchProfile = async () => {
            const res = await fetch("/api/users/")
            if (!res.ok) return
            const data = await res.json()
            if (data.address) {
                setAddressData({
                    firstName: data.address.firstName ?? "",
                    lastName: data.address.lastName ?? "",
                    country: data.address.country ?? "",
                    postal: data.address.postal ?? "",
                    street: data.address.street ?? "",
                    addition: data.address.addition ?? "",
                    city: data.address.city ?? "",
                })
            }
        }
        fetchProfile()
    }, [])

    const handleAddressChange = (field: keyof AddressData, value: string) => {
        setAddressData(prev => ({ ...prev, [field]: value }))
        if (addressErrors[field]) {
            setAddressErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    /**
     * Starts the checkout/payment flow.
     *
     * Flow:
     * 1. Validate address fields
     * 2. Validate accepted conditions
     * 3. Validate builder disclaimers (if needed)
     * 4. Send cart contents to POST /api/orders
     * 5. Create Order + Payment records
     * 6. Redirect user to Mollie checkout
     *
     * Notes:
     * * Builder items include serialized BuilderCheckoutDraft data
     * * Orders are only persisted after checkout starts
     * * Shipping costs are calculated client-side for display only
     */

    const handlePay = async () => {
        const newErrors: AddressErrors = {}

        if (!addressData.country.trim()) newErrors.country = "Land is verplicht"
        if (!addressData.firstName.trim()) newErrors.firstName = "Voornaam is verplicht"
        if (!addressData.lastName.trim()) newErrors.lastName = "Achternaam is verplicht"
        if (!addressData.street.trim()) newErrors.street = "Adres is verplicht"
        if (!addressData.postal.trim()) newErrors.postal = "Postcode is verplicht"
        if (!addressData.city.trim()) newErrors.city = "Woonplaats is verplicht"

        if (!conditionsAccepted) setChecklistErrors("Accepteer voorwaarde om door te gaan")
        if (!builderItemsAccepted && hasBuilderItems) setBuilderItemErrors("Accepteer voorwaarde om door te gaan")
        if (!conditionsAccepted || (!builderItemsAccepted && hasBuilderItems)) return

        if (Object.keys(newErrors).length > 0) {
            setAddressErrors(newErrors)
            return
        }

        try {
            setIsLoading(true)

            const response = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    items: items.map(item => ({
                        type: item.type,
                        productId: item.id,        
                        quantity: item.quantity,
                        price: item.price,
                        option: item.option,
                        image: item.image,
                        builderData: item.builderData,
                    })),
                    address: addressData,
                    paymentMethod,
                    note,
                }),
            })

            const { checkoutUrl } = await response.json()
            window.location.href = checkoutUrl
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/login")
        }
    }, [status, router])

    if (status === "loading") {
        return null
    }

    if (!session) {
        return null
    }

    return (
        <BackgroundMain className="flex flex-col">
            <div className="flex flex-row items-start">
                <BackgroundOverlay className="flex flex-col h-full pb-50 w-4/6 mb-0">
                    {/* Links — adres + betaalmethode */}
                    <div className="flex flex-col gap-8 w-full max-w-xl">
                        <H1 className={"mt-10"}>Bestellen</H1>
                        <div className={"flex items-start pl-10"}>
                            <H2 className="font-semibold">Bezorgadres</H2>
                        </div>
                        <div className={"w-full max-w-xl"}>
                            <AddressForm
                                data={addressData}
                                errors={addressErrors}
                                onChange={handleAddressChange}
                                disabled={false}
                            />
                        </div>

                        <div className={"flex items-start pl-10 mt-10"}>
                            <H2 className="font-semibold">Betaalmethode</H2>
                        </div>
                        <BackgroundContrast2 className="rounded-2xl p-8">
                            <div className="flex flex-col gap-3">
                                <div className={"flex justify-between"}>
                                    <div className={"flex items-center"}>
                                        <Icon name={`${paymentMethod === "ideal"? "CircleDot" : "Circle" }`} onClick={() => setPaymentMethod("ideal")} className={"cursor-pointer"} />
                                        <label className="flex items-center justify-between cursor-pointer rounded-xl px-4 py-3 hover:border-white/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="payment"
                                                    value="ideal"
                                                    checked={paymentMethod === "ideal"}
                                                    onChange={() => setPaymentMethod("ideal")}
                                                    className="accent-action"
                                                    hidden
                                                />
                                                <H3>iDeal</H3>
                                            </div>
                                        </label>
                                    </div>
                                    <div className={"pr-5"}>
                                        <Image src={"/payment/ideal.png"} alt={"Ideal"} width={50} height={50} />
                                    </div>
                                </div>

                                <div className={"flex justify-between"}>
                                    <div className={"flex items-center"}>
                                        <Icon name={`${paymentMethod === "paypal"? "CircleDot" : "Circle" }`} onClick={() => setPaymentMethod("paypal")} className={"cursor-pointer"} />
                                        <label className="flex items-center justify-between cursor-pointer rounded-xl px-4 py-3 hover:border-white/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="payment"
                                                    value="paypal"
                                                    checked={paymentMethod === "paypal"}
                                                    onChange={() => setPaymentMethod("paypal")}
                                                    className="accent-action"
                                                    hidden
                                                />
                                                <H3>PayPal</H3>
                                            </div>
                                        </label>
                                    </div>
                                    <div className={"pr-5 flex align-middle"}>
                                        <Image src={"/payment/paypal.png"} alt={"Paypal"} width={50} height={50} />
                                    </div>
                                </div>
                            </div>
                        </BackgroundContrast2>
                        <div className={"flex-row gap-3 my-4"}>
                            <div className={"flex items-center gap-3 my-4"}>
                                <input type="checkbox" value={"conditions"} onChange={(e) => setConditionsAccepted(e.target.checked)} />
                                <div className={"flex items-center flex-row gap-1"}>
                                    <H3>Ik ga akkoord met de </H3>
                                    <Link className={"text-action hover:underline cursor-pointer"} href={"/footer_pages/terms_conditions"}>algemene voorwaarden</Link>
                                </div>
                            </div>
                            {checklistErrors && <ErrorText className={"flex justify-start"}>{checklistErrors}</ErrorText>}
                            {hasBuilderItems && (
                                <div className={"flex items-center gap-3 my-4"}>
                                    <input type="checkbox" value={"builderItems"} onChange={(e) => setBuilderItemsAccepted(e.target.checked)} />
                                    <H3>Ik begrijp dat custom stands kunnen afwijken van de preview</H3>
                                </div>
                            )}
                            {builderItemErrors && <ErrorText className={"flex justify-start"}>{builderItemErrors}</ErrorText>}
                        </div>

                        <div className={"flex justify-center"}>
                            <Button onClick={handlePay} disabled={isLoading} className="w-full max-w-50">
                                {isLoading ? "Verwerken..." : "Betaal"}
                            </Button>
                        </div>
                    </div>
                </BackgroundOverlay>

                {/* Rechts — overzicht */}
                <BackgroundContrast1 className="rounded-2xl p-8 w-1/3 mx-50 flex flex-col gap-4 mt-[20vh]">
                    <div className="flex justify-center text-center border-b border-black/30 pb-2">
                        <H2 className={"text-contrast font-medium"}>Overzicht</H2>
                    </div>

                    <div className={`flex justify-between ${overviewOpen? "": "border-b border-black/30 pb-4"}`}>
                        <H3 className={"text-contrast"}>Producten</H3>
                        <div className="flex items-center gap-4">
                            <div onClick={() => setOverviewOpen(prev => !prev)} className={"flex items-center gap-3 cursor-pointer"}>
                                <H3 className={"text-contrast font-bold"}>{items.reduce((sum, item) => sum + item.quantity, 0)}</H3>
                                <Icon name={"ChevronDown"} size={24} color={"black"} className={"mr-5"} />
                            </div>
                            <H3 className={"text-contrast"}>€{total.toFixed(2)}</H3>
                        </div>
                    </div>

                    {overviewOpen && (
                        <div className="flex flex-col gap-4 border-t border-black/20 pt-4">
                            {items.map(item => (
                                <div key={`${item.id}-${item.option}`} className={"flex items-center gap-4 pb-4 border-b border-black/20"}>
                                    {item.type === "product"? (
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            width={70}
                                            height={70}
                                            className="rounded-lg object-cover"
                                        />
                                    ) : (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="object-cover rounded-lg w-42 h-auto"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <H3 className="text-contrast">{item.title}</H3>
                                        <P className="opacity-80 text-contrast">{item.option}</P>
                                    </div>
                                    <P className={"text-contrast font-medium"}>€{(item.price * item.quantity).toFixed(2)}</P>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-between py-1">
                        <H3 className={"text-contrast"}>Verzendkosten</H3>
                        <H3 className={"text-contrast"}>€{SHIPPING_COST},-</H3>
                    </div>

                    <div className="flex justify-between items-center border-t border-black/20 pt-5">
                        <H3 className={"text-contrast"}>Totaalprijs</H3>
                        <H2 className={"text-contrast font-medium"}>€{(total + SHIPPING_COST).toFixed(2)}</H2>
                    </div>
                </BackgroundContrast1>
            </div>
        </BackgroundMain>
    )
}