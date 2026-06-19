"use client"

import React from "react";
import { useSession } from "next-auth/react"
import {BackgroundContrast1} from "@/components/ui/Background"
import { Icon } from "@/components/ui/Icon"
import {H2, H3, P} from "@/components/ui/Typography";
import {Input} from "@/components/ui/Input";
import {Quote} from "@/types/Quote";

type Props = {
    isOpen: boolean
    onCloseAction: () => void
    quote: Quote
    onAcceptQuoteAction: (quoteId: string) => void
    onCancelQuoteAction: (quoteId: string) => void
}

export default function QuoteDetailModal({ isOpen, onCloseAction, quote, onAcceptQuoteAction, onCancelQuoteAction }: Props) {
    const { data: session } = useSession()

    if (!isOpen) return null

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("nl-NL", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })

    const mailBody = `Beste ${quote.firstName},
    
    Als antwoord op uw vraag: 
    ${quote.question}
    
    Het antwoord:
    
    
    Met vriendelijke groet,
    
    HoekvanNoek`;

    const handleCompleteQuote = async (quote: Quote, accepted: boolean) => {
        try{
            const body = accepted
                ? JSON.stringify({ id: quote.id, accepted: true })
                : JSON.stringify({ id: quote.id, accepted: false, status: "REJECTED" })

            const res = await fetch("/api/quotes", {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: body
            })
            if (res.ok){
                if (accepted) {
                    onAcceptQuoteAction(quote.id)
                } else {
                    onCancelQuoteAction(quote.id)
                }
                onCloseAction()
            }
        } catch (error){
            console.log(error)
        }
    }

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

                    {session?.user.role === "ADMIN" ?(
                        <div className="flex justify-center gap-30 mb-6">
                            <div>
                                <H2 className="mb-2 text-contrast">Offerte #{quote.id.slice(-6).toUpperCase()}</H2>
                                <H3 className="mb-6 text-contrast">{formatDate(quote.createdAt)}</H3>
                            </div>
                            <div>
                                <H2 className="text-contrast mb-2">Besteller: {quote.firstName} {quote.lastName}</H2>
                                <div className="flex gap-4 items-center">
                                    <Icon name="Mail" color="black" size={30} />
                                    <a href={`mailto:${quote.email}?subject=Offerte - #${quote.id.slice(-6).toUpperCase()}&body=${encodeURIComponent(mailBody)}`} className="text-action-contrast hover:underline text-center">
                                        Stuur gebruiker een mail
                                    </a>
                                </div>
                            </div>
                        </div>
                    ): (
                        <div className="flex justify-center mb-6">
                            <H2 className="text-contrast">Offerte #{quote.id.slice(-6).toUpperCase()} - {formatDate(quote.createdAt)}</H2>
                        </div>
                    )}
                        <BackgroundContrast1 className={"p-8 rounded-2xl flex flex-col gap-6 items-center"}>
                            {/* Contact */}
                            <div className={"w-1/2"}>
                                <H3 className="mb-4 text-contrast">Contactgegevens</H3>
                                <div className="flex gap-4 mb-4">
                                    <div className="flex-1">
                                        <Input
                                            type="text"
                                            value={quote.firstName ?? ""}
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Input
                                            type="text"
                                            value={quote.lastName ?? ""}
                                            readOnly={true}
                                        />
                                    </div>
                                </div>
                                <Input
                                    type="text"
                                    value={quote.email ?? ""}
                                    readOnly={true}
                                />
                            </div>

                            {quote.files.filter((file) => file.type === "model").length > 0  &&(
                                <div className={"w-1/2"}>
                                    <H3 className="mb-2 text-contrast">Modelbestand:</H3>
                                    <div className={"flex justify-start items-start"}>
                                        <H3 className={"text-action-contrast mt-1 mb-2"}>{quote.files[0].filename}</H3>
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div className={"w-1/2"}>
                                <H3 className="mb-1 text-contrast">Beschrijf je doel zo duidelijk mogelijk:</H3>
                                <P className="mb-2 text-contrast">
                                    Wat wil je hebben? Welke afmetingen? Waar is het voor? Wat voor kleur?
                                </P>
                                <textarea
                                    placeholder="..."
                                    value={quote.description}
                                    readOnly={true}
                                    rows={4}
                                    className="rounded-lg border p-3 w-full min-w-60 h-40 resize-none bg-input-normal border-input-normal outline-none input-shadow mt-2 "
                                />
                            </div>

                            {quote.files.filter((file) => file.type === "image").length > 0 &&(
                                <div className={"w-1/2"}>
                                    <H3 className="mb-2 text-contrast">Extra informatie foto(s):</H3>
                                    {quote.files.filter((file) => file.type === "image").map((file) => (
                                        <div key={file.id} className={"flex justify-start items-start mb-1"}>
                                            <H3 className={"text-action-contrast mt-2"}>{file.filename}</H3>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Questions */}
                            <div className={"w-1/2"}>
                                <H3 className="mb-2 text-contrast">Stuur hier je vragen</H3>
                                <textarea
                                    placeholder="..."
                                    value={quote.question || ""}
                                    readOnly={true}
                                    className="rounded-lg border p-3 w-full min-w-60 h-40 resize-none bg-input-normal border-input-normal outline-none input-shadow mt-2"
                                />
                            </div>

                            {session?.user.role === "ADMIN" && quote.status === "PENDING" && !quote.accepted &&(
                                <div className={"flex gap-20 mt-5 mb-10"}>
                                    <div onClick={() => handleCompleteQuote(quote, true)} className="flex flex-col items-center cursor-pointer">
                                        <Icon name="ThumbsUp" size={60} color="#6D8F78" />
                                        <H2 className="text-contrast pt-2">Keur offerte goed</H2>
                                    </div>
                                    <div onClick={() => handleCompleteQuote(quote, false)} className="flex flex-col items-center cursor-pointer">
                                        <Icon name="ThumbsDown" size={60} color="#EC4C4CFF" />
                                        <H2 className="text-contrast pt-2">Keur offerte af</H2>
                                    </div>
                                </div>
                            )}
                        </BackgroundContrast1>
                    </div>
                </div>
        </div>
    )
}