"use client"

import React, {useEffect, useState} from "react"
import { useSession } from "next-auth/react"
import {signOut} from "next-auth/react";
import {ErrorText, H1, H2, H3, P} from "@/components/ui/Typography"
import {BackgroundMain, BackgroundContrast2, BackgroundOverlay, BackgroundContrast1} from "@/components/ui/Background"
import { Button } from "@/components/ui/Button"
import { AddressForm, AddressData, AddressErrors } from "@/components/forms/AddressForm"
import { Icon } from "@/components/ui/Icon";
import {Input} from "@/components/ui/Input";

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
        items: Array<{
            id: string
            quantity: number
            price: string
            product: {
                id: string
                title: string
                images: { url: string }[]
            } | null
            builderItem: {
                id: string
                imageUrl: string | null
            } | null
        }>
    }>>([])

    const [credentialsErrors, setCredentialsErrors] = useState<{ email?: string; password?: string }>({})
    const [addressErrors, setAddressErrors] = useState<AddressErrors>({})
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [isAdjustingCredentials, setIsAdjustingCredentials] = useState(false)
    const [isAdjustingAddress, setIsAdjustingAddress] = useState(false)

    const [step, setStep] = useState('profielgegevens')

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

// Opslaan
    const handleSaveAddress = async () => {
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

    const handleSaveCredentials = async () => {
        setIsSaving(true)
        try {
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({type: "credentials", ...credentialsData}),
            })

            if (res.ok) {
                setSaveSuccess(true)
                setIsAdjustingCredentials(false)
                setCredentialsData(prev => ({...prev, password: ""})) // wachtwoord leegmaken na opslaan
                setTimeout(() => setSaveSuccess(false), 3000)
            } else {
                const data = await res.json()
                if (data.error) setCredentialsErrors({email: data.error})
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
        setAddressData(prev => ({ ...prev, [field]: value }))
        if (addressErrors[field]) {
            setAddressErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const handleSignOut = async ()=> {
        await signOut({ redirectTo: "/auth/login" })
    }

    if (status === "loading") return <BackgroundMain><P>Laden...</P></BackgroundMain>
    if (!session) return <BackgroundMain><P>Je bent niet ingelogd.</P></BackgroundMain>

  return (
      <BackgroundMain>
          <BackgroundOverlay>
              <div className={"flex items-center justify-center w-full"}>
                  <div className={"w-3/4 ml-15"}>
                      <H1>Mijn profiel</H1>
                      <H2 className={"mt-5"}>Welkom, {addressData?.lastName? addressData.firstName + " " + addressData.lastName : 'gebruiker'}</H2>
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
                                  <H2 className={`mb-6 pt-10 text-contrast`}>Bekijk mijn:</H2>
                                  <div onClick={() => setStep('profielgegevens')} className={"cursor-pointer"}>
                                      <H3 className={`border-t pt-4 pr-3 pl-1 border-black/30 ${step === 'profielgegevens' ? "text-action-contrast" : 'text-contrast'}`}>Profielgegevens</H3>
                                  </div>
                                  <div onClick={() => setStep('bestellingen')} className={"cursor-pointer"}>
                                      <H3 className={`border-t pt-4 pr-3 pl-1 border-black/30 ${step === 'bestellingen' ? "text-action-contrast" : 'text-contrast'}`}>Bestellingen</H3>
                                  </div>
                                  <div onClick={() => setStep('offertes')} className={"cursor-pointer"}>
                                      <H3 className={`border-t pt-4 pr-3 pl-1 border-black/30 ${step === 'offertes' ? "text-action-contrast" : 'text-contrast'}`}>Offertes</H3>
                                  </div>
                              </div>
                          </BackgroundContrast1>
                      </div>

                      {/* Rechter kolom — twee blokken onder elkaar */}
                      {step === 'profielgegevens' && (
                      <div className="flex flex-col gap-6 flex-1">
                          <H2 className={"ml-5 mt-5"}>Profielgegevens:</H2>
                          {/* Inloggegevens */}
                          <BackgroundContrast2 className="p-8 rounded-2xl relative">
                              <div className="flex items-start justify-center">
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
                                              <Button onClick={handleSaveCredentials} disabled={isSaving} className="min-w-48">
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
                              </div>
                          </BackgroundContrast2>

                          {/* Bezorgadres */}
                          <BackgroundContrast2 className="p-8 rounded-2xl relative">
                              <div className="flex items-start justify-center">
                                  <div className="max-w-xl w-full">
                                      <H2 className="mb-6">Bezorgadres</H2>
                                      <div className="space-y-6">
                                          <AddressForm
                                              data={addressData}
                                              errors={addressErrors}
                                              onChange={handleAddressChange}
                                              disabled={!isAdjustingAddress}
                                          />
                                          {isAdjustingAddress ? (
                                              <div className="flex justify-center pt-6">
                                                  <Button onClick={handleSaveAddress} disabled={isSaving} className="min-w-48">
                                                      {isSaving ? "Opslaan..." : saveSuccess ? "Opgeslagen!" : "Opslaan"}
                                                  </Button>
                                              </div>
                                          ) : <div className={"py-9"}></div>}
                                      </div>
                                  </div>
                                  <div className={"flex items-center gap-3 cursor-pointer absolute top-7 right-8"} onClick={() => setIsAdjustingAddress(prev => !prev)}>
                                      <Icon name={"SquarePen"} size={35} opacity="70%" color={isAdjustingAddress ? "#98CEAA" : "white"}/>
                                      <H3 className={'text-action'}>Pas aan</H3>
                                  </div>
                                  {/*<div className="flex items-center gap-3 cursor-pointer absolute top-20 right-8"*/}
                                  {/*     onClick={() => setIsAdjustingCredentials(prev => !prev)}>*/}
                                  {/*    <Icon name={"CirclePlus"} size={35} opacity="70%" color={isAdjustingCredentials ? "#98CEAA" : "white"}/>*/}
                                  {/*    <H3 className="text-action">Voeg toe</H3>*/}
                                  {/*</div>*/}
                              </div>
                          </BackgroundContrast2>
                      </div>)}

                      {step === 'bestellingen' && (
                          <div className="flex flex-col gap-6 flex-1">
                              <H2 className={"ml-5 mt-5"}>Mijn bestellingen:</H2>
                              {orderData.length === 0 ? (
                                  <P className="ml-5">Je hebt nog geen bestellingen.</P>
                              ) : (
                                  orderData.map(order => (
                                      <BackgroundContrast2 key={order.id} className="p-6 rounded-2xl">
                                          <div className="flex justify-between items-center mb-4">
                                              <H3>Bestelling #{order.id.slice(-6).toUpperCase()}</H3>
                                              <P className="text-white/70">{order.status}</P>
                                          </div>
                                          {order.items.map(item => (
                                              <div key={item.id} className="flex items-center gap-4 py-2 border-t border-white/20">
                                                  {/* Product order */}
                                                  {item.product && (
                                                      <>
                                                          <img
                                                              src={item.product.images[0]?.url}
                                                              alt={item.product.title}
                                                              className="w-16 h-16 object-cover rounded-lg"
                                                          />
                                                          <div>
                                                              <P>{item.product.title}</P>
                                                              <P className="text-white/70">Aantal: {item.quantity}</P>
                                                          </div>
                                                      </>
                                                  )}
                                                  {/* Builder order */}
                                                  {item.builderItem && (
                                                      <>
                                                          {item.builderItem.imageUrl && (
                                                              <img
                                                                  src={item.builderItem.imageUrl}
                                                                  alt="Builder item"
                                                                  className="w-16 h-16 object-cover rounded-lg"
                                                              />
                                                          )}
                                                          <div>
                                                              <P>Custom Builder Item</P>
                                                              <P className="text-white/70">Aantal: {item.quantity}</P>
                                                          </div>
                                                      </>
                                                  )}
                                                  <P className="ml-auto">€{item.price}</P>
                                              </div>
                                          ))}
                                          <div className="flex justify-end pt-4">
                                              <H3>Totaal: €{order.total}</H3>
                                          </div>
                                      </BackgroundContrast2>
                                  ))
                              )}
                          </div>
                      )}

                      {step === 'offertes' && (
                          <div className="flex flex-col gap-6 flex-1">
                                <H2 className={"ml-5 mt-5"}>Mijn offertes:</H2>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </BackgroundMain>
  );
}

