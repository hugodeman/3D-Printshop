"use client"

import { BackgroundContrast1 } from "@/components/ui/Background"
import { Icon } from "@/components/ui/Icon"
import {H2, H3, P} from "@/components/ui/Typography";
import {Input} from "@/components/ui/Input";
import React from "react";
import {Quote} from "@/types/Quote";

type Props = {
    isOpen: boolean
    onCloseAction: () => void
    quote: Quote
}


export default function QuoteDetailModal({ isOpen, onCloseAction, quote }: Props) {
    if (!isOpen) return null
    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("nl-NL", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })

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

                    <div className={"p-8 flex flex-col gap-6 w-full justify-center items-center"}>
                        <H2 className={"ml-5 text-contrast mb-4"}>{formatDate(quote.createdAt)} - offerte #{quote.id.slice(-6).toUpperCase()}</H2>
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
                                    <H3 className={"text-action-contrast"}>{quote.files[0].filename}</H3>
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
                                        <H3 className={"text-action-contrast"}>{file.filename}</H3>
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
                    </div>
                </div>
            </BackgroundContrast1>
        </div>
    )
}