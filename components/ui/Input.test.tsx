import { render, screen } from '@testing-library/react'
import { Input } from './Input'

describe('Input', () => {
    it('rendert een input element', () => {
        render(<Input placeholder="Vul in" />)
        expect(screen.getByPlaceholderText('Vul in')).toBeInTheDocument()
    })

    it('heeft standaard normal variant', () => {
        render(<Input />)
        expect(screen.getByRole('textbox')).toHaveClass('bg-input-normal')
    })

    it('past contrast variant toe', () => {
        render(<Input variant="contrast" />)
        expect(screen.getByRole('textbox')).toHaveClass('bg-input-contrast')
    })

    it('past lg size toe (standaard)', () => {
        render(<Input />)
        expect(screen.getByRole('textbox')).toHaveClass('w-full')
    })

    it('past sm size toe', () => {
        render(<Input inputSize="sm" />)
        expect(screen.getByRole('textbox')).toHaveClass('w-70')
    })

    it('is disabled via props', () => {
        render(<Input disabled />)
        expect(screen.getByRole('textbox')).toBeDisabled()
    })
})