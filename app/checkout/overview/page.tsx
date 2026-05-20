"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {H1, H2, H3, P} from "@/components/ui/Typography"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { StepButtons } from "@/components/builder/StepButtons"
import { useBuilderStore } from "@/lib/builder-store"
import { readBuilderCheckoutDraft, subscribeBuilderCheckoutDraft, type BuilderCheckoutDraft } from "@/lib/builder-checkout-draft"
import {useCart} from "@/context/CartContext";

export default function OverviewPage() {
	const router = useRouter()
	const setStep = useBuilderStore((state) => state.setStep)
	const [data, setData] = useState<BuilderCheckoutDraft | null>(() => readBuilderCheckoutDraft())
	const { addItem } = useCart()

	useEffect(() => {
		return subscribeBuilderCheckoutDraft(() => {
			setData(readBuilderCheckoutDraft())
		})
	}, [])

	if (!data) {
		return (
			<div className="min-h-screen bg-[#1A1C1E]">
				<div className="h-[calc(100vh-120px)] flex flex-col items-center justify-center gap-4 text-white">
					<H3>Geen creatie gevonden</H3>
					<Button onClick={() => router.push("/builder")}>Terug naar builder</Button>
				</div>
			</div>
		)
	}

	const totalItems = data.decorations.length
	// Pricing mirrors the server: M=€20, L=€25, XL=€30, +€5 per decoration
	const PLATFORM_PRICE: Record<number, number> = { 10: 20, 15: 25, 20: 30 }
	const platformPrice = PLATFORM_PRICE[data.platformSize ?? 10] ?? 20
	const totalPrice = (platformPrice + totalItems * 5).toFixed(2)

	const steps = [
		{
			id: 1,
			label: "Platform",
			done: true,
			isCurrent: false,
			onClick: () => {
				setStep(1)
				router.push("/builder")
			},
		},
		{
			id: 2,
			label: "Decoraties",
			done: true,
			isCurrent: false,
			onClick: () => {
				setStep(2)
				router.push("/builder")
			},
		},
		{ id: 3, label: "Bestellen", done: false, isCurrent: true },
	]

	async function handleRouter(){
		if (!data) return
		addItem({
			id: crypto.randomUUID(),
			type: "builder",
			title: "Custom Stand",
			price: Number(totalPrice),
			image: data?.previewImage ?? "/placeholder.png",
			builderData: data,
		})
		router.push("/shoppingcart")
	}

	return (
		<div className="min-h-screen bg-[#1A1C1E]">
			<div className="h-[calc(100vh-120px)] p-6 text-white">
				<div className="mx-auto flex max-h-[90%] h-full w-full max-w-[70%] flex-col">

					{/* HEADER */}
					<div className="mb-6 mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
						<Link
							href="/builder"
							className="inline-flex items-center gap-2 justify-self-start text-p font-medium text-white transition-colors hover:text-[#98CEAA]"
						>
							<Icon name="ArrowBigLeft" size={25} />
							Terug naar builder
						</Link>

						<div className="justify-self-center">
							<StepButtons steps={steps} />
						</div>
						<div />
					</div>

					{/* MAIN CARD + OVERLAY */}
					<div className="relative mt-10 min-h-0 h-3/4 w-full flex-1 lg:overflow-visible">
						<div className="h-full flex-1 flex flex-col rounded-4xl border border-white/20 bg-white/2 p-4 shadow-[0_0_30px_rgba(0,0,0,0.45)] lg:pr-28">
							{/* Preview foto van de build */}
							{data.previewImage ? (
								<div className="relative flex-1 min-h-0 overflow-hidden rounded-xl">
									<Image
										src={data.previewImage}
										alt="Jouw creatie"
										fill
										className="object-cover rounded-xl"
										unoptimized
									/>
								</div>
							) : (
								<div className="flex-1 min-h-0 flex items-center justify-center rounded-xl border border-white/10 bg-white/5">
									<P className="text-white/40">Geen preview beschikbaar</P>
								</div>
							)}
						</div>

						<div className="mt-6 flex flex-col rounded-3xl border border-white/10 bg-white/2 p-5 shadow-[-12px_0_40px_0px_rgba(0,0,0,0.6)] backdrop-blur-xl lg:absolute lg:-right-60 lg:top-20 lg:bottom-20 lg:z-10 lg:mt-0 lg:w-100">
							<H1>Jouw custom stand</H1>

							<div className="mt-15">
								<div className="flex justify-between ">
									<P className="text-white/80">Basis</P>
									<H3>{data.platformName}</H3>
								</div>

								<div className="flex justify-between border-t border-white/10 my-6 pt-6">
									<P className="text-white/80">Decoraties</P>
									<H3>{totalItems}</H3>
								</div>

								<div className="flex justify-between border-t border-white/10 my-6 pt-6">
									<P className={"text-white/80"}>Geschatte maaktijd</P>
									{/*voorbeeld berekening*/}
									<H3>{(1.5 + totalItems * 0.75).toFixed(1)} uur</H3>
								</div>
							</div>

							<div className="border-t border-white/10">
								<div className="flex justify-between text-lg mt-12">
									<H3>Totaal Prijs</H3>
									{/*bereking platform + decoraties*/}
									<H2>€ {totalPrice}</H2>
								</div>
							</div>

							<Button
								className="mt-auto w-full flex justify-center gap-4"
								onClick={handleRouter}
							>
								<Icon name="ShoppingBag" size={20} color="#1F2126" />
								<H3 className={"text-contrast"}>Bestellen</H3>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}