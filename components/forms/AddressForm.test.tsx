import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddressForm, AddressData, AddressErrors } from './AddressForm'

const defaultData: AddressData = {
    country: '',
    firstName: '',
    lastName: '',
    street: '',
    addition: '',
    postal: '',
    city: '',
}

const noErrors: AddressErrors = {}

describe('AddressForm', () => {
    it('rendert alle velden', () => {
        render(<AddressForm data={defaultData} errors={noErrors} onChange={vi.fn()} disabled={false} />)
        expect(screen.getByPlaceholderText('Voornaam')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Achternaam')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Adres')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Postcode')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Woonplaats')).toBeInTheDocument()
    })

    it('roept onChange aan met het juiste veld en waarde', async () => {
        const onChange = vi.fn()
        render(<AddressForm data={defaultData} errors={noErrors} onChange={onChange} disabled={false} />)

        await userEvent.type(screen.getByPlaceholderText('Voornaam'), 'Jan')

        expect(onChange).toHaveBeenCalledWith('firstName', expect.any(String))
    })

    it('toont foutmeldingen bij errors', () => {
        const errors: AddressErrors = {
            firstName: 'Voornaam is verplicht',
            postal: 'Ongeldige postcode',
        }
        render(<AddressForm data={defaultData} errors={errors} onChange={vi.fn()} disabled={false} />)

        expect(screen.getByText('Voornaam is verplicht')).toBeInTheDocument()
        expect(screen.getByText('Ongeldige postcode')).toBeInTheDocument()
    })

    it('toont geen foutmelding als er geen error is', () => {
        render(<AddressForm data={defaultData} errors={noErrors} onChange={vi.fn()} disabled={false} />)
        expect(screen.queryByText('is verplicht')).not.toBeInTheDocument()
    })

    it('disabled alle velden als disabled=true', () => {
        render(<AddressForm data={defaultData} errors={noErrors} onChange={vi.fn()} disabled={true} />)

        expect(screen.getByPlaceholderText('Voornaam')).toBeDisabled()
        expect(screen.getByPlaceholderText('Adres')).toBeDisabled()
        expect(screen.getByRole('combobox')).toBeDisabled()
    })

    it('roept onChange aan bij selecteren van land', () => {
        const onChange = vi.fn()
        render(<AddressForm data={defaultData} errors={noErrors} onChange={onChange} disabled={false} />)

        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Nederland' } })

        expect(onChange).toHaveBeenCalledWith('country', 'Nederland')
    })
})