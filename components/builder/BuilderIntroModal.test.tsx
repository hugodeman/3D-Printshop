import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BuilderIntroModal } from './BuilderIntroModal'

describe('BuilderIntroModal', () => {
    it('rendert niets als isOpen false is', () => {
        const { container } = render(
            <BuilderIntroModal isOpen={false} onCloseAction={vi.fn()} />
        )
        expect(container.firstChild).toBeNull()
    })

    it('rendert de modal als isOpen true is', () => {
        render(<BuilderIntroModal isOpen={true} onCloseAction={vi.fn()} />)
        expect(screen.getByText('Start met bouwen')).toBeInTheDocument()
    })

    it('roept onCloseAction aan bij klikken op de knop', async () => {
        const onClose = vi.fn()
        render(<BuilderIntroModal isOpen={true} onCloseAction={onClose} />)
        await userEvent.click(screen.getByText('Start met bouwen'))
        expect(onClose).toHaveBeenCalledOnce()
    })

    it('roept onCloseAction aan bij klikken op de backdrop', async () => {
        const onClose = vi.fn()
        const { container } = render(
            <BuilderIntroModal isOpen={true} onCloseAction={onClose} />
        )
        await userEvent.click(container.firstChild as HTMLElement)
        expect(onClose).toHaveBeenCalledOnce()
    })

    it('sluit niet bij klikken op de modal zelf', async () => {
        const onClose = vi.fn()
        render(<BuilderIntroModal isOpen={true} onCloseAction={onClose} />)
        await userEvent.click(screen.getByText('Maak je eigen decoratieve stand voor je favoriete beeldjes!'))
        expect(onClose).not.toHaveBeenCalled()
    })
})