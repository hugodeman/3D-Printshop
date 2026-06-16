"use client";

import Link from "next/link";
import Image from "next/image";
import { H1, H2, H3, P } from "@/components/ui/Typography"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon";
import { BackgroundMain, BackgroundContrast1, BackgroundContrast2 } from "@/components/ui/Background";
import {useEffect, useState} from "react";
import {Product} from "@/types/Product";

export default function HomePage() {
    const [productData, setProductData] = useState<Product[]>([])

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch("/api/products")
                if (!response.ok) {
                    throw new Error("Failed to fetch products")
                }
                const data = await response.json()
                setProductData(data)
            } catch (error) {
                console.error("Error fetching products:", error)
            }
        }

        fetchProducts()
    }, [])

    const randomProducts = productData
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)

    return (
        <BackgroundMain>

            {/* Hero sectie */}
                <div className="relative flex items-center justify-center gap-12 pt-20 pb-20 w-full"
                     style={{ backgroundImage: "url('/img/bg2.jpg')" }}
                >
                    <div className="absolute inset-0 bg-black/50" />

                    <BackgroundContrast2 className={"bg-background/50 flex justify-center rounded-2xl backdrop-blur-2xl py-20 pr-20"}>
                        <div className="relative z-10 w-full flex flex-col justify-center items-start ml-20">
                            <H1>Ben jij op zoek naar leuke figuurtjes of praktische dingetjes?</H1>
                            <H2 className="mt-8 text-lg">Dan ben jij hier goed terecht!</H2>
                            <H3 className="mt-10 text-white/90">
                                HoekvanNoek biedt velen leuke figuurtjes en handige dingetjes aan om van te kunnen genieten.
                            </H3>
                            <H3 className="mt-6 text-white/90">
                                Kan je niet vinden wat je zoekt of heb je een specifiek product nodig?{" "} - {" "}
                                <Link href="/quote" className="text-action underline inline-block">
                                    Maak een offerte
                                </Link>
                            </H3>
                        </div>
                    </BackgroundContrast2>
                </div>

            {/* Populaire producten */}
            <section className="px-16 py-14">
                <H2 className="text-center mb-10">Populaire producten</H2>
                <div className={"grid grid-cols-3 gap-15 px-130 justify-center items-center mb-20"}>
                    {randomProducts.map((product) => (
                        <Link key={product.id} href={`/webshop/${product.id}`} className={"flex justify-center"}>
                            <BackgroundContrast2 className={"rounded-2xl cursor-pointer flex flex-col gap-4 p-6 min-w-70 min-h-85 w-full mb-5 transition-transform duration-200 hover:scale-110 hover:shadow-xl"}>
                                <div className={"flex justify-center"}>
                                    <Image src={product.images[0]?.url} alt={product.title} width={200} height={200} loading={"lazy"} />
                                </div>
                                <div className={"mb-5 pl-5"}>
                                    <H3 className={"mb-2"}>{product.title}</H3>
                                    <H3>€ {product.price}</H3>
                                </div>
                            </BackgroundContrast2>
                        </Link>
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
                            <Image src={"/img/H_5.jpg"} alt={"Hondje"} width={260} height={100} />
                            <Icon name="ArrowBigRight" size={56} opacity="90%" color={"black"} />
                            <Image src={"/img/final_dog.png"} alt={"Stand"} width={350} height={300}/>
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
