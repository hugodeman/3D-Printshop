"use client"

import React, {useEffect, useState} from "react"
import { useSession } from "next-auth/react"
import {signOut} from "next-auth/react";
import Image from "next/image";
import {ErrorText, H1, H2, H3, P} from "@/components/ui/Typography"
import {BackgroundMain, BackgroundContrast2, BackgroundOverlay, BackgroundContrast1} from "@/components/ui/Background"
import { Button } from "@/components/ui/Button"
import { AddressForm, AddressData, AddressErrors } from "@/components/forms/AddressForm"
import { Icon } from "@/components/ui/Icon";
import {Input} from "@/components/ui/Input";
import ProductDetailModal from "@/components/shop/ProductDetailModal"
import BuilderPreviewModal from "@/components/builder/BuilderPreviewModal"
import QuoteDetailModal from "@/components/quote/QuoteDetailModal";
import AdminPanelPage from "@/components/profile/AdminPanel";
import { BuilderConfig } from "@/types/BuilderConfig"
import {Product} from "@/types/Product";
import {BuilderItem} from "@/types/BuilderItem";
import {Quote} from "@/types/Quote";

/**
 * User profile dashboard.
 *
 * Features:
 * - account credential management
 * - address management
 * - order history
 * - builder item previews
 * - product detail previews
 * - quotes history
 * - quote detail previews
 */

export default function ProfilePage() {
    const { data: session, status } = useSession()

    const [addressData, setAddressData] = useState<AddressData>({
        country: "",
        firstName: "",
        lastName: "",
        street: "",
        addition: "",
        postal: "",
        city: "",
    })

    const [credentialsData, setCredentialsData] = useState({
        email: "",
        password: "",
    })

    const [orderData, setOrderData] = useState<Array<{
        id: string
        status: string
        total: string
        note: string | null
        createdAt: string
        firstName: string | null
        lastName: string | null
        email: string | null
        items: Array<{
            id: string
            quantity: number
            price: number
            option: string | null
            product: Product
            builderItem: BuilderItem
        }>
    }>>([])

    const [quoteData, setQuoteData] = useState<Quote[]>([])

    const [credentialsErrors, setCredentialsErrors] = useState<{ email?: string; password?: string }>({})
    const [addressErrors, setAddressErrors] = useState<AddressErrors>({})
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [isAdjustingCredentials, setIsAdjustingCredentials] = useState(false)
    const [isAdjustingAddress, setIsAdjustingAddress] = useState(false)

    const [step, setStep] = useState("profielgegevens")

    const [selectedProduct, setSelectedProduct] = useState<{
        product: Product
        option: string
    } | null>(null)

    const [selectedBuilderItem, setSelectedBuilderItem] = useState<BuilderConfig | null>(null)

    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)

    // Ophalen bij mount
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

            setCredentialsData({ email: data.email ?? "", password: "" })
        }

        fetchProfile()
    }, [])

    useEffect(() => {
        const fetchOrders = async () => {
            const res = await fetch("/api/orders")
            if (!res.ok) return
            const data = await res.json()
            setOrderData(data)
        }

        fetchOrders()
    }, [])

    useEffect(() => {
        const fetchQuotes = async () => {
            const res = await fetch("/api/quotes")
            if (!res.ok) return
            const data = await res.json()
            setQuoteData(data)
        }

        fetchQuotes()
    }, [])

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("nl-NL", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })

// Opslaan
    const handleSaveCredentials = async (e: React.SubmitEvent) => {
        e.preventDefault()
        const newErrors: { email?: string; password?: string } = {}

        if (!credentialsData.email.trim()) {
            newErrors.email = "Email is verplicht"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentialsData.email)) {
            newErrors.email = "Ongeldig emailadres"
        }
        if (credentialsData.password && credentialsData.password.length < 8) {
            newErrors.password = "Wachtwoord moet minimaal 8 karakters bevatten"
        }

        if (Object.keys(newErrors).length > 0) {
            setCredentialsErrors(newErrors)
            return // Niet opslaan
        }

        setIsSaving(true)
        try {
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "credentials", ...credentialsData }),
            })
            if (res.ok) {
                setSaveSuccess(true)
                setIsAdjustingCredentials(false)
                setCredentialsData(prev => ({ ...prev, password: "" }))
                setTimeout(() => setSaveSuccess(false), 3000)
            } else {
                const data = await res.json()
                if (data.error) setCredentialsErrors({ email: data.error })
            }
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveAddress = async (e: React.SubmitEvent) => {
        e.preventDefault()
        const newErrors: AddressErrors = {}

        const addressFields = [
            addressData.country, addressData.firstName, addressData.lastName,
            addressData.street, addressData.postal, addressData.city
        ]
        const hasAnyField = addressFields.some(f => f.trim() !== "")

        if (hasAnyField) {
            if (!addressData.country.trim()) newErrors.country = "Land is verplicht"
            if (!addressData.firstName.trim()) newErrors.firstName = "Voornaam is verplicht"
            if (!addressData.lastName.trim()) newErrors.lastName = "Achternaam is verplicht"
            if (!addressData.street.trim()) newErrors.street = "Adres is verplicht"
            if (!addressData.postal.trim()) newErrors.postal = "Postcode is verplicht"
            if (!addressData.city.trim()) newErrors.city = "Woonplaats is verplicht"
        }

        if (Object.keys(newErrors).length > 0) {
            setAddressErrors(newErrors)
            return // Niet opslaan
        }

        setIsSaving(true)
        try {
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "address", ...addressData }),
            })
            if (res.ok) {
                setSaveSuccess(true)
                setIsAdjustingAddress(false)
                setTimeout(() => setSaveSuccess(false), 3000)
            }
        } finally {
            setIsSaving(false)
        }
    }

    const handleCredentialsChange = (field: keyof typeof credentialsData, value: string) => {
        setCredentialsData(prev => ({ ...prev, [field]: value }))
        if (credentialsErrors[field]) {
            setCredentialsErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const handleAddressChange = (field: keyof AddressData, value: string) => {
        setAddressData(prev => ({...prev, [field]: value}))
        if (addressErrors[field]) {
            setAddressErrors(prev => ({...prev, [field]: undefined}))
        }
    }

    const handleCompleteOrder = (orderId: string) => {
        setOrderData(prev =>
            prev.map(o => o.id === orderId ? { ...o, status: "COMPLETED" } : o)
        )
    }

    const handleCompleteQuote = (quoteId: string) => {
        setQuoteData(prev =>
            prev.map(q => q.id === quoteId ? { ...q, status: "COMPLETED" } : q)
        )
    }

    const handleAcceptQuote = (quoteId: string) => {
        setQuoteData(prev =>
            prev.map(q => q.id === quoteId ? { ...q, accepted: true } : q)
        )
    }

    const handleCancelQuote = (quoteId: string) => {
        setQuoteData(prev =>
            prev.map(q => q.id === quoteId ? { ...q, accepted: false, status: "REJECTED" } : q)
        )
    }

    const handleSignOut = async ()=> {
        await signOut({ redirectTo: "/auth/login" })
    }

    if (status === "loading") return <BackgroundMain><P>Laden...</P></BackgroundMain>
    if (!session) return <BackgroundMain><P>Je bent niet ingelogd.</P></BackgroundMain>

    if (session.user.role === "ADMIN"){
        return (
            <AdminPanelPage
                orderData={orderData}
                quoteData={quoteData}
                credentialsData={credentialsData}
                onCredentialsChangeAction={handleCredentialsChange}
                onSaveCredentialsAction={handleSaveCredentials}
                credentialsErrors={credentialsErrors}
                isSaving={isSaving}
                saveSuccess={saveSuccess}
                onCompleteOrderAction={handleCompleteOrder}
                onCompleteQuoteAction={handleCompleteQuote}
                onAcceptQuoteAction={handleAcceptQuote}
                onCancelQuoteAction={handleCancelQuote}
            />
        )
    }

    return (
      <BackgroundMain>
          <BackgroundOverlay>
              <div className={"flex items-center justify-center w-full"}>
                  <div className={"w-3/4 ml-15"}>
                      <H1>Mijn profiel</H1>
                      {isAdjustingAddress? (
                        <H2 className={"mt-5"}>Welkom, gebruiker</H2>
                      ):
                        <H2 className={"mt-5"}>Welkom, {addressData.lastName && addressData.firstName? addressData.firstName + " " + addressData.lastName : "gebruiker"}</H2>
                      }
                  </div>
                  <div onClick={() => handleSignOut()} className="cursor-pointer flex items-center gap-3">
                      <H3 className={"underline text-action"}>Log uit</H3>
                      <Icon name="LogOut" size={40} opacity={"70%"}/>
                  </div>
              </div>
          </BackgroundOverlay>
          <div className={"relative"}>
              <div className={"flex gap-6 px-6 pb-12 w-full justify-center"}>
                  <div className="flex gap-y-6 px-6 pb-12 w-1/2">
                      {/* Linker navigatie kolom */}
                      <div className="shrink-0">
                          <BackgroundContrast1 className="flex justify-center rounded-2xl absolute left-10 top-5 px-8">
                              <div className={"pr-10 pl-6 pb-6 rounded-2xl w-full space-y-4"}>
                                  <H2 className={"mb-6 pt-10 text-contrast"}>Bekijk mijn:</H2>
                                  <div onClick={() => setStep("profielgegevens")} className={"cursor-pointer"}>
                                      <H3 className={`border-t pt-4 pr-3 pl-1 border-black/30 ${step === "profielgegevens" ? "text-action-contrast" : "text-contrast"}`}>Profielgegevens</H3>
                                  </div>
                                  <div onClick={() => setStep("bestellingen")} className={"cursor-pointer"}>
                                      <H3 className={`border-t pt-4 pr-3 pl-1 border-black/30 ${step === "bestellingen" ? "text-action-contrast" : "text-contrast"}`}>Bestellingen</H3>
                                  </div>
                                  <div onClick={() => setStep("offertes")} className={"cursor-pointer"}>
                                      <H3 className={`border-t pt-4 pr-3 pl-1 border-black/30 ${step === "offertes" ? "text-action-contrast" : "text-contrast"}`}>Offertes</H3>
                                  </div>
                              </div>
                          </BackgroundContrast1>
                      </div>

                      {/* Rechter kolom — twee blokken onder elkaar */}
                      {step === "profielgegevens" && (
                      <div className="flex flex-col gap-6 flex-1">
                          <H2 className={"ml-5 mt-5"}>Profielgegevens:</H2>
                          {/* Inloggegevens */}
                          <BackgroundContrast2 className="p-8 rounded-2xl relative">
                              <form onSubmit={handleSaveCredentials} className="flex items-start justify-center">
                                  <div className="max-w-xl w-full">
                                      <H2 className="mb-6">Inloggegevens</H2>
                                      <div className="space-y-4">
                                          <div>
                                              <P className="mb-1 text-white/70">E-mailadres</P>
                                              <Input
                                                  type="email"
                                                  value={credentialsData.email}
                                                  onChange={(e) => handleCredentialsChange("email", e.target.value)}
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
                                                      onChange={(e) => handleCredentialsChange("password", e.target.value)}
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

                          {/* Bezorgadres */}
                          <BackgroundContrast2 className="p-8 rounded-2xl relative">
                              <div className="flex items-start justify-center">
                                  <div className="max-w-xl w-full">
                                      <H2 className="mb-6">Bezorgadres</H2>
                                      <form onSubmit={handleSaveAddress} className="space-y-6">
                                          <AddressForm
                                              data={addressData}
                                              errors={addressErrors}
                                              onChange={handleAddressChange}
                                              disabled={!isAdjustingAddress}
                                          />
                                          {isAdjustingAddress ? (
                                              <div className="flex justify-center pt-6">
                                                  <Button type="submit" disabled={isSaving} className="min-w-48">
                                                      {isSaving ? "Opslaan..." : saveSuccess ? "Opgeslagen!" : "Opslaan"}
                                                  </Button>
                                              </div>
                                          ) : <div className={"py-9"}></div>}
                                      </form>
                                  </div>
                                  <div className={"flex items-center gap-3 cursor-pointer absolute top-7 right-8"} onClick={() => setIsAdjustingAddress(prev => !prev)}>
                                      <Icon name={"SquarePen"} size={35} opacity="70%" color={isAdjustingAddress ? "#98CEAA" : "white"}/>
                                      <H3 className={"text-action"}>Pas aan</H3>
                                  </div>
                                  {/*<div className="flex items-center gap-3 cursor-pointer absolute top-20 right-8"*/}
                                  {/*     onClick={() => setIsAdjustingCredentials(prev => !prev)}>*/}
                                  {/*    <Icon name={"CirclePlus"} size={35} opacity="70%" color={isAdjustingCredentials ? "#98CEAA" : "white"}/>*/}
                                  {/*    <H3 className="text-action">Voeg toe</H3>*/}
                                  {/*</div>*/}
                              </div>
                          </BackgroundContrast2>
                      </div>)}

                      {step === "bestellingen" && (
                          <div className="flex flex-col gap-6 flex-1">
                              <H2 className={"ml-5 mt-5"}>Mijn bestellingen:</H2>
                              {orderData.length === 0 ? (
                                  <P className="ml-5">Je hebt nog geen bestellingen.</P>
                              ) : (
                                  orderData.map(order => (
                                      <div key={order.id}>
                                          <div className={"flex items-center justify-between gap-4 ml-5 mr-10 mt-8 mb-2"}>
                                              <H3 className={"ml-5"}>{formatDate(order.createdAt)} - bestelling #{order.id.slice(-6).toUpperCase()}</H3>
                                              <P className="text-white/70 pr-4">{order.status}</P>
                                          </div>
                                          <BackgroundContrast2 key={order.id} className="pl-6 pr-6 pb-6 rounded-2xl">
                                              {order.items.map(item => (
                                                  <div key={item.id} className="flex items-center gap-4 pb-5 border-b border-white/20">
                                                      {/* Product order */}
                                                      {item.product && (
                                                          <div className={"flex gap-4"}>
                                                              <Image src={item.product.images[0]?.url || ""} alt={item.product.title} width={200} height={200} className="rounded-lg object-cover mt-5" loading="lazy" />
                                                              <div className={"flex flex-col justify-between"}>
                                                                  <div className={"flex flex-col justify-between"}>
                                                                      <div onClick={() => {
                                                                          if (!item.product) return

                                                                          setSelectedProduct({
                                                                              product: item.product,
                                                                              option: item.option ?? "",
                                                                          })
                                                                      }} className={"cursor-pointer"}>
                                                                        <H2 className={"mt-11 text-action hover:underline"}>{item.product.title}</H2>
                                                                      </div>
                                                                      <P className="text-white/80 py-3">Aantal: {item.quantity}</P>
                                                                      <P className="pt-10 pb-4"> Opmaak: {item.option}</P>
                                                                  </div>
                                                                  <P className="text-white pb-5">maaktijd: {item.product.deliveryTime} uur</P>
                                                              </div>
                                                          </div>
                                                      )}
                                                      {/* Builder order */}
                                                      {item.builderItem && (
                                                          <div className={"flex gap-4"}>
                                                              {item.builderItem.imageUrl && (
                                                                  // eslint-disable-next-line @next/next/no-img-element
                                                                  <img
                                                                      src={item.builderItem.imageUrl}
                                                                      alt="Builder item"
                                                                      className="object-cover rounded-lg w-72 h-auto mt-5"
                                                                  />
                                                              )}
                                                              <div className={"flex flex-col justify-between"}>
                                                                  <div>
                                                                      <div onClick={() => {
                                                                          const config = item.builderItem?.configJson as BuilderConfig
                                                                          if (config) setSelectedBuilderItem(config)
                                                                      }} className={"cursor-pointer"}>
                                                                        <H2 className={"mt-11 text-action hover:underline"}>Custom Builder Item</H2>
                                                                      </div>
                                                                       <P className="text-white/80 py-3">Aantal: {item.quantity}</P>
                                                                       <P className="pt-10 pb-4">Opmaak: {item.builderItem?.painted ? "Geverfd" : "Niet geverfd"}</P>
                                                                  </div>
                                                                  <P className="text-white pb-5">maaktijd: {item.builderItem.deliveryTime || "1"} uur</P>
                                                              </div>
                                                          </div>
                                                      )}
                                                      <H3 className="ml-auto pr-6">€{item.price}</H3>
                                                  </div>
                                              ))}
                                              <div className={"flex flex-row justify-between"}>
                                                  <div className={"w-full"}>
                                                      <H3 className={"mt-5 mb-2"}>vragen/opmerkingen: </H3>
                                                      <div className={"flex"}>
                                                          <Input
                                                              disabled={true}
                                                              inputSize={"lg"}
                                                              type="text"
                                                              value={order.note || ""}
                                                          />
                                                        <div className={"w-full"}></div>
                                                      </div>

                                                  </div>
                                                  <div className="flex flex-row items-center gap-2 justify-end pt-4 pr-3">
                                                      <H3>Totaal:</H3>
                                                      <H2>€{order.total}</H2>
                                                  </div>
                                              </div>
                                          </BackgroundContrast2>
                                      </div>
                                  ))
                              )}
                          </div>
                      )}

                      {step === "offertes" && (
                          <div className="flex flex-col gap-6 flex-1">
                              <H2 className={"ml-5 mt-5"}>Mijn offertes:</H2>
                              {quoteData.length === 0 ? (
                                  <P className="ml-5">Je hebt nog geen offertes.</P>
                              ) : (
                                  quoteData.map(quote => (
                                      <div key={quote.id}>
                                          <div className={"flex items-center justify-between gap-4 ml-5 mr-10 mt-8 mb-2"}>
                                              <H3 className={"ml-5"}>{formatDate(quote.createdAt)} - offerte #{quote.id.slice(-6).toUpperCase()}</H3>
                                              <H3>Geaccepteerd?</H3>
                                          </div>
                                          <BackgroundContrast2 key={quote.id} className="pl-6 pr-6 py-15 rounded-2xl flex flex-col">
                                              <div className={"flex flex-row justify-between"}>
                                                  <div className={"ml-10 min-w-50"}>
                                                      {quote.status === "PENDING" && (
                                                          <div className={"flex items-center gap-4"}>
                                                              <Icon name={"Hourglass"} size={40}/>
                                                              <H3>In behandeling</H3>
                                                          </div>
                                                      )}
                                                      {quote.status === "REJECTED" &&(
                                                          <div className={"flex items-center gap-4"}>
                                                              <Icon name={"X"} size={40}/>
                                                              <H3>Afgewezen</H3>
                                                          </div>
                                                      )}
                                                      {quote.status === "COMPLETED" &&(
                                                          <div className={"flex items-center gap-4"}>
                                                              <Icon name={"Check"} size={40}/>
                                                              <H3>Afgerond</H3>
                                                          </div>
                                                      )}
                                                  </div>
                                                  <div onClick={() => {
                                                      if (!quote) return

                                                      setSelectedQuote(quote)
                                                  }}
                                                       className={"cursor-pointer flex items-center"}
                                                  >
                                                      <H3 className={"text-action underline hover:cursor-pointer"}>Bekijk details</H3>
                                                  </div>
                                                  <div className={"mr-15"}>
                                                      {quote.accepted ? (
                                                            <div>
                                                                <Icon name={"ThumbsUp"} size={40}/>
                                                            </div>
                                                      ): !quote.accepted && quote.status === "REJECTED" ? (
                                                          <div>
                                                              <Icon name={"ThumbsDown"} size={40}/>
                                                          </div>
                                                      ):
                                                          <div>
                                                              <Icon name={"Clock"} size={40}/>
                                                          </div>
                                                      }
                                                  </div>
                                              </div>
                                          </BackgroundContrast2>
                                      </div>
                                  ))
                              )}
                          </div>
                      )}
                  </div>
              </div>
          </div>
          {selectedProduct && (
              <ProductDetailModal
                  isOpen={true}
                  onCloseAction={() => setSelectedProduct(null)}
                  product={{
                      ...selectedProduct.product,
                      price: Number(selectedProduct.product.price),
                  }}
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
          {selectedQuote && (
              <QuoteDetailModal
                  isOpen={true}
                  onCloseAction={() => setSelectedQuote(null)}
                  quote={selectedQuote}
                  onAcceptQuoteAction={(quoteId) => {
                      handleAcceptQuote(quoteId)
                      setSelectedQuote(null)
                  }}
                  onCancelQuoteAction={(quoteId) => {
                      handleCancelQuote(quoteId)
                      setSelectedQuote(null)
                  }}
              />
          )}
      </BackgroundMain>
  );
}

