import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {

    it('rendert children correct', () => {
        render(<Button>Klik mij</Button>)
        expect(screen.getByRole('button', { name: 'Klik mij' })).toBeInTheDocument()
    })

    it('heeft standaard primary variant', () => {
        render(<Button>Test</Button>)
        const btn = screen.getByRole('button')
        expect(btn).toHaveClass('bg-button-primary')
    })

    it('past secondary variant toe', () => {
        render(<Button variant="secondary">Test</Button>)
        expect(screen.getByRole('button')).toHaveClass('bg-button-secondary')
    })

    it('past active klasse toe bij primary', () => {
        render(<Button isActive>Test</Button>)
        expect(screen.getByRole('button')).toHaveClass('bg-button-primary-active')
    })

    it('past active klasse toe bij secondary', () => {
        render(<Button variant="secondary" isActive>Test</Button>)
        expect(screen.getByRole('button')).toHaveClass('bg-button-secondary-active')
    })

    it('voegt custom className toe', () => {
        render(<Button className="mt-4">Test</Button>)
        expect(screen.getByRole('button')).toHaveClass('mt-4', 'px-6') // eigen + base klassen
    })

    it('roept onClick aan bij klikken', async () => {
        const onClick = vi.fn()
        render(<Button onClick={onClick}>Test</Button>)
        await userEvent.click(screen.getByRole('button'))
        expect(onClick).toHaveBeenCalledOnce()
    })

    it('is disabled via props', () => {
        render(<Button disabled>Test</Button>)
        expect(screen.getByRole('button')).toBeDisabled()
    })

})