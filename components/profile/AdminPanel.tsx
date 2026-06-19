"use client"

import React, { useState } from "react"
import { signOut } from "next-auth/react"
import Image from "next/image"
import {ErrorText, H1, H2, H3, P} from "@/components/ui/Typography"
import { BackgroundMain, BackgroundContrast1, BackgroundContrast2, BackgroundOverlay } from "@/components/ui/Background"
import { Icon } from "@/components/ui/Icon"
import {Input} from "@/components/ui/Input";
import {Button} from "@/components/ui/Button";
import QuoteDetailModal from "@/components/quote/QuoteDetailModal"
import AdminOrderDetailModal from "@/components/profile/AdminOrderDetailModal";
import { Quote } from "@/types/Quote"
import { Order } from "@/types/Order";

type Props = {
    orderData: Order[]
    quoteData: Quote[]
    credentialsData: { email: string; password: string }
    onCredentialsChangeAction: (field: "email" | "password", value: string) => void
    onSaveCredentialsAction: (e: React.SubmitEvent) => void
    credentialsErrors: { email?: string; password?: string }
    onCompleteOrderAction: (orderId: string) => void
    onCompleteQuoteAction: (id: string) => void
    onAcceptQuoteAction: (id: string) => void
    onCancelQuoteAction: (id: string) => void
    isSaving: boolean
    saveSuccess: boolean
}

export default function AdminPanelPage({ orderData, quoteData, credentialsData, onCredentialsChangeAction, onSaveCredentialsAction, isSaving, credentialsErrors, onCompleteOrderAction, onCompleteQuoteAction, saveSuccess, onCancelQuoteAction, onAcceptQuoteAction }: Props) {
    const [step, setStep] = useState("bestellingen")
    const [orderFilter, setOrderFilter] = useState<"new" | "completed">("new")
    const [quoteFilter, setQuoteFilter] = useState<"pending" | "completed" | "rejected">("pending")
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
    const [isAdjustingCredentials, setIsAdjustingCredentials] = useState(false)

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("nl-NL", {
            day: "2-digit", month: "short", year: "numeric",
        })

    const filteredOrders = orderData.filter(o =>
        orderFilter === "new" ? o.status === "PAID" : o.status === "COMPLETED"
    )

    const filteredQuotes = quoteData.filter(q => {
        if (quoteFilter === "pending") return q.status === "PENDING"
        if (quoteFilter === "completed") return q.status === "COMPLETED"
        if (quoteFilter === "rejected") return q.status === "REJECTED"
    })

    const handleCompleteOrder = async (order: Order) => {
        try{
            const res = await fetch("/api/orders", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: order.id,
                    status: "COMPLETED",
                })
            })
            if (res.ok){
                onCompleteOrderAction(order.id)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const handleCompleteQuote = async (quote: Quote) => {
        try{
            const res = await fetch("/api/quotes", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: quote.id,
                    status: "COMPLETED",
                })
            })
            if (res.ok){
                onCompleteQuoteAction(quote.id)
            }
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <BackgroundMain>
            <BackgroundOverlay>
                <div className="flex items-center justify-center w-full">
                    <div className="w-3/4 ml-15">
                        <H1>Admin dashboard</H1>
                        <H2 className="mt-5">Beheer bestellingen & offertes</H2>
                    </div>
                    <div onClick={() => signOut({ redirectTo: "/auth/login" })} className="cursor-pointer flex items-center gap-3">
                        <H3 className="underline text-action">Log uit</H3>
                        <Icon name="LogOut" size={40} opacity="70%" />
                    </div>
                </div>
            </BackgroundOverlay>

            <div className="relative">
                <div className="flex gap-6 px-6 pb-12 w-full justify-center">
                    <div className="flex gap-y-6 px-6 pb-12 w-3/4">

                        {/* Navigatie kolom */}
                        <div className="shrink-0">
                            <BackgroundContrast1 className="flex justify-center rounded-2xl absolute left-10 top-5 px-8">
                                <div className="pr-10 pl-6 pb-6 rounded-2xl w-full space-y-4">
                                    <H2 className="mb-6 pt-10 text-contrast">Bekijk</H2>
                                    <div onClick={() => setStep("bestellingen")} className="cursor-pointer">
                                        <H3 className={`border-t pt-4 pr-3 pl-1 border-black/30 ${step === "bestellingen" ? "text-action-contrast" : "text-contrast"}`}>
                                            Bestellingen
                                        </H3>
                                    </div>
                                    <div onClick={() => setStep("offertes")} className="cursor-pointer">
                                        <H3 className={`border-t pt-4 pr-3 pl-1 border-black/30 ${step === "offertes" ? "text-action-contrast" : "text-contrast"}`}>
                                            Offertes
                                        </H3>
                                    </div>
                                    <div onClick={() => setStep("profielgegevens")} className={"cursor-pointer"}>
                                        <H3 className={`border-t pt-4 pr-3 pl-1 border-black/30 ${step === "profielgegevens" ? "text-action-contrast" : "text-contrast"}`}>
                                            Profielgegevens
                                        </H3>
                                    </div>
                                </div>
                            </BackgroundContrast1>
                        </div>

                        {/* Bestellingen */}
                        {step === "bestellingen" && (
                            <div className="flex flex-col gap-6 flex-1">
                                <div className="flex items-center justify-center ml-5 mt-5 mr-10 gap-4">
                                    <div onClick={() => setOrderFilter("new")} className="cursor-pointer">
                                        <Button className={`px-4 py-2 min-w-40 ${orderFilter === "new" ? "border-action" : " border-white/20"}`} isActive={orderFilter === "new"}>
                                            Nieuw
                                        </Button>
                                    </div>
                                    <div onClick={() => setOrderFilter("completed")} className="cursor-pointer">
                                        <Button className={`px-4 py-2 min-w-40 ${orderFilter === "completed" ? "border-action" : " border-white/20"}`} isActive={orderFilter === "completed"}>
                                            Afgerond
                                        </Button>
                                    </div>
                                </div>
                                <div className={"ml-20"}>
                                    <div className={"flex justify-between"}>
                                        <H2 className={"ml-25"}>{orderFilter === "new"? "Nieuwe " : "Afgeronde "}bestellingen</H2>
                                        <H2>Bestelling afgerond? </H2>
                                    </div>

                                    {filteredOrders.length === 0 ? (
                                        <P className="ml-5">Geen bestellingen gevonden.</P>
                                    ) : (
                                        filteredOrders.map(order => {
                                            const firstImage = order.items[0]?.product?.images?.[0]?.url ?? order.items[0].builderItem?.imageUrl
                                            const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)

                                            return (
                                                <div key={order.id} className={"w-full flex justify-center gap-[10vw]"}>
                                                    <BackgroundContrast2 className="pl-6 pr-6 py-5 rounded-2xl w-3/4 flex justify-between h-60 mb-2 mt-8">
                                                        <div className={"flex gap-15"}>
                                                            {order.items[0].product? (
                                                                <Image className="object-cover h-auto w-auto" src={firstImage} alt="Order" width={200} height={100} />
                                                            ): (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img src={firstImage} alt="Builder item" className="object-cover h-auto rounded-lg w-72" />
                                                            )}
                                                            <div className={"flex flex-col justify-center gap-10"}>
                                                                <div>
                                                                    <H2>Bestelling #{order.id.slice(-6).toUpperCase()}</H2>
                                                                    <H3>{formatDate(order.createdAt)}</H3>
                                                                </div>
                                                                <H3>{totalItems} {totalItems === 1? "product" : "producten"}</H3>
                                                            </div>
                                                        </div>
                                                        <div className={"flex items-center"} onClick={() => setSelectedOrder(order)}>
                                                            <H2 className={"text-action cursor-pointer hover:underline"}>Bekijk bestelling</H2>
                                                        </div>
                                                        <div className="flex flex-row items-center gap-2 justify-end pr-3">
                                                            <H3>Totaal:</H3>
                                                            <H2>€{order.total}</H2>
                                                        </div>
                                                    </BackgroundContrast2>
                                                    <div className={"flex items-center cursor-pointer px-4"} onClick={() => handleCompleteOrder(order)}>
                                                        <Icon name={"ThumbsUp"} size={50} color={order.status === "COMPLETED" ? "#6D8F78" : "darkgray"} />
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Offertes */}
                        {step === "offertes" && (
                            <div className="flex flex-col gap-6 flex-1 ml-20">
                                <div className="flex items-center justify-center ml-5 mt-5 mr-10 gap-4">
                                    <div onClick={() => setQuoteFilter("pending")} className="cursor-pointer">
                                        <Button className={`px-4 py-2 min-w-40 ${quoteFilter === "pending" ? "border-action" : " border-white/20"}`} isActive={quoteFilter === "pending"}>
                                            In behandeling
                                        </Button>
                                    </div>
                                    <div onClick={() => setQuoteFilter("completed")} className="cursor-pointer">
                                        <Button className={`px-4 py-2 min-w-40 ${quoteFilter === "completed" ? "border-action" : " border-white/20"}`} isActive={quoteFilter === "completed"}>
                                            Afgerond
                                        </Button>
                                    </div>
                                    <div onClick={() => setQuoteFilter("rejected")} className="cursor-pointer">
                                        <Button className={`px-4 py-2 min-w-40 ${quoteFilter === "rejected" ? "border-action" : " border-white/20"}`} isActive={quoteFilter === "rejected"}>
                                            Afgewezen
                                        </Button>
                                    </div>
                                </div>
                                <div className={"flex justify-between"}>
                                    <H2 className={"ml-25"}>{quoteFilter} offertes</H2>
                                    <H2>Offerte afgerond? </H2>
                                </div>

                                {filteredQuotes.length === 0 ? (
                                    <P className="ml-5">Geen offertes gevonden.</P>
                                ) : (
                                    filteredQuotes.map(quote => (
                                        <div key={quote.id} className={"w-full flex justify-center gap-[10vw]"}>
                                            <BackgroundContrast2 className="px-6 py-10 rounded-2xl w-3/4 flex justify-between h-40 mb-2 mt-8 items-center">
                                                <div className={"ml-10"}>
                                                    <H2 className={"mb-2"}>Offerte: #{quote.id.slice(-6).toUpperCase()}</H2>
                                                    <H3>{formatDate(quote.createdAt)}</H3>
                                                </div>
                                                <div onClick={() => setSelectedQuote(quote)} className="cursor-pointer py-10">
                                                    <H2 className="text-action underline">Bekijk details</H2>
                                                </div>
                                                <div className={"mr-15 flex items-center gap-4"}>
                                                    <H3>Geaccepteerd: </H3>
                                                    {quote.accepted ? (
                                                        <div>
                                                            <Icon name={"ThumbsUp"} size={40} className={"mb-2"} color={"rgb(152 206 170 / 0.7)"}/>
                                                        </div>
                                                    ): !quote.accepted && quote.status === "REJECTED" ? (
                                                        <div>
                                                            <Icon name={"ThumbsDown"} size={40} className={"mt-2"} color={"rgb(225 112 112 / 0.7)"}/>
                                                        </div>
                                                        ):
                                                        <div>
                                                            <Icon name={"Clock"} size={40}/>
                                                        </div>
                                                    }
                                                </div>
                                            </BackgroundContrast2>

                                            {quote.status === "COMPLETED" || quote.status === "REJECTED" ? (
                                                <div className={"flex items-center px-4"}>
                                                    {quote.status === "REJECTED" ? (
                                                        <Icon name={"ThumbsDown"} size={50} color={"#e17070"} />
                                                    ): (
                                                        <Icon name={"ThumbsUp"} size={50} color={quote.status === "COMPLETED" ? "#6D8F78" : "darkgray"} />
                                                    )}
                                                </div>
                                            ): (
                                                <div className={"flex items-center cursor-pointer px-4"} onClick={() => handleCompleteQuote(quote)}>
                                                    {quote.status === "REJECTED" ? (
                                                        <Icon name={"ThumbsDown"} size={50} color={"#e17070"} />
                                                    ): (
                                                        <Icon name={"ThumbsUp"} size={50} color={quote.status === "COMPLETED" ? "#6D8F78" : "darkgray"} />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {step === "profielgegevens" && (
                            <div className="flex flex-col gap-6 flex-1">
                                <H2 className={"ml-5 mt-5"}>Profielgegevens:</H2>
                                {/* Inloggegevens */}
                                <BackgroundContrast2 className="p-8 rounded-2xl relative">
                                    <form onSubmit={onSaveCredentialsAction} className="flex items-start justify-center">
                                        <div className="max-w-xl w-full">
                                            <H2 className="mb-6">Inloggegevens</H2>
                                            <div className="space-y-4">
                                                <div>
                                                    <P className="mb-1 text-white/70">E-mailadres</P>
                                                    <Input
                                                        type="email"
                                                        value={credentialsData.email}
                                                        onChange={(e) => onCredentialsChangeAction("email", e.target.value)}
                                                        placeholder="Email"
                                                        disabled={!isAdjustingCredentials}
                                                    />
                                                    {credentialsErrors.email && <ErrorText>{credentialsErrors.email}</ErrorText>}
                                                </div>

                                                {isAdjustingCredentials && (
                                                    <div>
                                                        <P className="mb-1 text-white/70">Nieuw wachtwoord</P>
                                                        <Input
                                                            type="password"
                                                            value={credentialsData.password}
                                                            onChange={(e) => onCredentialsChangeAction("password", e.target.value)}
                                                            placeholder="Nieuw wachtwoord (laat leeg om niet te wijzigen)"
                                                        />
                                                        {credentialsErrors.password && <ErrorText>{credentialsErrors.password}</ErrorText>}
                                                    </div>
                                                )}
                                            </div>

                                            {isAdjustingCredentials ? (
                                                <div className="flex justify-center pt-6">
                                                    <Button type={"submit"} disabled={isSaving} className="min-w-48">
                                                        {isSaving ? "Opslaan..." : saveSuccess ? "Opgeslagen!" : "Opslaan"}
                                                    </Button>
                                                </div>
                                            ) : <div className="py-9"></div>}
                                        </div>

                                        <div className="flex items-center gap-3 cursor-pointer absolute top-7 right-8"
                                             onClick={() => setIsAdjustingCredentials(prev => !prev)}>
                                            <Icon name={"SquarePen"} size={35} opacity="70%" color={isAdjustingCredentials ? "#98CEAA" : "white"}/>
                                            <H3 className="text-action">Pas aan</H3>
                                        </div>
                                    </form>
                                </BackgroundContrast2>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedQuote && (
                <QuoteDetailModal isOpen={true} onCloseAction={() => setSelectedQuote(null)} quote={selectedQuote}
                    onAcceptQuoteAction={onAcceptQuoteAction} onCancelQuoteAction={onCancelQuoteAction}
                />
            )}
            {selectedOrder && (
                <AdminOrderDetailModal isOpen={true} onCloseAction={() => setSelectedOrder(null)} order={selectedOrder}/>
            )}
        </BackgroundMain>
    )
}