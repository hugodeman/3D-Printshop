"use client"

import { Input } from "@/components/ui/Input"
import { ErrorText } from "@/components/ui/Typography"

const COUNTRIES = [
    "Nederland", "België", "Duitsland", "Frankrijk",
    "Luxemburg", "Verenigd Koninkrijk", "Italië", "Spanje", "Portugal", "Denemarken",
    "Zweden", "Noorwegen", "Finland", "Ierland", "Oostenrijk", "Zwitserland",
    "Griekenland", "Cyprus", "Malta"
]

export type AddressData = {
    country: string
    firstName: string
    lastName: string
    street: string
    addition: string
    postal: string
    city: string
}

export type AddressErrors = {
    [K in keyof AddressData]?: string
}

interface AddressFormProps {
    data: AddressData
    errors: AddressErrors
    onChange: (field: keyof AddressData, value: string) => void
    disabled: boolean
}

export function AddressForm({ data, errors, onChange, disabled }: AddressFormProps) {
    return (
        <div>
            <div className="space-y-6">
                <div>
                    <select
                        value={data.country}
                        onChange={(e) => onChange("country", e.target.value)}
                        className="rounded-[5px] border input-shadow outline-none transition-colors h-12 px-4 text-p w-full bg-input-normal border-input-normal"
                        disabled={disabled}
                    >
                        <option value="" disabled hidden>Land</option>
                        {COUNTRIES.map(country => (
                            <option key={country} value={country}>{country}</option>
                        ))}
                    </select>
                    {errors.country && <ErrorText>{errors.country}</ErrorText>}
                </div>

                <div className="flex justify-between">
                    <div>
                        <Input
                            value={data.firstName}
                            onChange={(e) => onChange("firstName", e.target.value)}
                            placeholder="Voornaam"
                            inputSize="sm"
                            disabled={disabled}
                        />
                        {errors.firstName && <ErrorText>{errors.firstName}</ErrorText>}
                    </div>
                    <div>
                        <Input
                            value={data.lastName}
                            onChange={(e) => onChange("lastName", e.target.value)}
                            placeholder="Achternaam"
                            inputSize="sm"
                            disabled={disabled}
                        />
                        {errors.lastName && <ErrorText>{errors.lastName}</ErrorText>}
                    </div>
                </div>

                <div>
                    <Input
                        value={data.street}
                        onChange={(e) => onChange("street", e.target.value)}
                        placeholder="Adres"
                        disabled={disabled}
                    />
                    {errors.street && <ErrorText>{errors.street}</ErrorText>}
                </div>

                <div>
                    <Input
                        value={data.addition}
                        onChange={(e) => onChange("addition", e.target.value)}
                        placeholder="Toevoeging"
                        inputSize="lg"
                        disabled={disabled}
                    />
                </div>

                <div className="flex justify-between">
                    <div>
                        <Input
                            value={data.postal}
                            onChange={(e) => onChange("postal", e.target.value)}
                            placeholder="Postcode"
                            inputSize="sm"
                            disabled={disabled}
                        />
                        {errors.postal && <ErrorText>{errors.postal}</ErrorText>}
                    </div>
                    <div>
                        <Input
                            value={data.city}
                            onChange={(e) => onChange("city", e.target.value)}
                            placeholder="Woonplaats"
                            inputSize="sm"
                            disabled={disabled}
                        />
                        {errors.city && <ErrorText>{errors.city}</ErrorText>}
                    </div>
                </div>
            </div>
        </div>
    )
}