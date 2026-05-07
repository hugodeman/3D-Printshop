"use client";

import { H1, H2, H3, P } from "@/components/ui/Typography"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon";
import { BackgroundMain, BackgroundOverlay, BackgroundContrast1, BackgroundContrast2 } from "@/components/ui/Background";
import Link from "next/link";

const popularProducts = [
    { id: 1, title: "Product 1", price: "10,-" },
    { id: 2, title: "Product 2", price: "10,-" },
    { id: 3, title: "Product 3", price: "10,-" },
]

function ImagePlaceholder({ className = "" }: { className?: string }) {
    return (
        <div className={`flex items-center justify-center bg-[#3a3a3a] rounded-xl ${className}`}>
            <Icon name="Image" size={48} opacity="40%" />
        </div>
    )
}

export default function HomePage() {
    return (
        <BackgroundMain>

            {/* Hero sectie */}
            <BackgroundOverlay>
                <div className="flex items-center justify-end gap-12 px-16 pb-12 pt-8 w-full">
                    <div className="w-full flex flex-col justify-center items-start ml-20">
                        <H1>Ben jij op zoek naar leuke figuurtjes of praktische dingetjes?</H1>
                        <H2 className="mt-8 text-lg">Dan ben jij hier goed terecht!</H2>
                        <P className="mt-10 text-white/90">
                            HoekvanNoek biedt velen leuke figuurtjes en handige dingetjes aan om van te kunnen genieten.
                        </P>
                        <P className="mt-6 text-white/90">
                            Kan je niet vinden wat je zoekt of heb je een specifiek product nodig?{" "} - {" "}
                            <Link href="/offerte" className="text-action underline inline-block">
                                Maak een offerte
                            </Link>
                        </P>
                    </div>
                    <div className="shrink-0 w-1/2 flex justify-center">
                        <ImagePlaceholder className="w-96 h-56" />
                    </div>
                </div>
            </BackgroundOverlay>

            {/* Populaire producten */}
            <section className="px-16 py-14">
                <H2 className="text-center mb-10">Populaire producten</H2>
                <div className="flex gap-10 justify-center">
                    {popularProducts.map(product => (
                        <BackgroundContrast2 key={product.id} className="rounded-2xl p-5 w-1/6 cursor-pointer hover:opacity-90 transition-opacity">
                            <ImagePlaceholder className="w-full h-[10vw] mb-4" />
                            <H3 className="font-medium">{product.title}</H3>
                            <P className="mt-1">€ {product.price}</P>
                        </BackgroundContrast2>
                    ))}
                </div>
                <div className="flex justify-center mt-10">
                    <Link href="/webshop" className="inline-block">
                        <Button variant="primary">Bekijk alle producten</Button>
                    </Link>
                </div>
            </section>

            {/* Builder CTA */}
            <section className="px-16 pb-14">
                <BackgroundContrast1 className="rounded-4xl px-12 pb-15 pt-8 w-8/10 mx-auto">
                    <H2 className="text-center text-contrast mb-8">Maak je beeldjes weer leuk!</H2>
                    <div className="flex items-center gap-8">
                        {/* Voor/na afbeeldingen */}
                        <div className="flex items-center gap-6 shrink-0 w-1/2 justify-center">
                            <ImagePlaceholder className="w-44 h-44" />
                            <Icon name="ArrowBigRight" size={56} opacity="90%" color={"black"} />
                            <ImagePlaceholder className="w-44 h-44" />
                        </div>

                        {/* Tekst */}
                        <div className="flex flex-col gap-4">
                            <div>
                                <H3 className="text-contrast">Kunnen jouw beeldjes een upgrade gebruiken?</H3>
                                <P className="text-contrast mt-5">
                                    Maak je beeldjes uniek door ze een eigen decoratieve stand te geven.
                                </P>
                                <P className="text-contrast mt-2">
                                    Kies uit voorgemaakte modellen en combineer ze naar wens.
                                </P>
                            </div>
                            <div className={"flex justify-center mt-4"}>
                                <Link href="/builder" className="inline-block">
                                    <Button variant={"primary"} isActive>Maak je stand</Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </BackgroundContrast1>
            </section>

        </BackgroundMain>
    )
}
