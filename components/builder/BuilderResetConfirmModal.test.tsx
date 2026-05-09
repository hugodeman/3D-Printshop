import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BuilderResetConfirmModal } from './BuilderResetConfirmModal'

describe('BuilderResetConfirmModal', () => {
    it('rendert niets als isOpen false is', () => {
        const { container } = render(
            <BuilderResetConfirmModal isOpen={false} onCancelAction={vi.fn()} onConfirmAction={vi.fn()} />
        )
        expect(container.firstChild).toBeNull()
    })

    it('rendert de modal als isOpen true is', () => {
        render(
            <BuilderResetConfirmModal isOpen={true} onCancelAction={vi.fn()} onConfirmAction={vi.fn()} />
        )
        expect(screen.getByText('Scene resetten?')).toBeInTheDocument()
    })

    it('roept onCancelAction aan bij klikken op Annuleren', async () => {
        const onCancel = vi.fn()
        render(
            <BuilderResetConfirmModal isOpen={true} onCancelAction={onCancel} onConfirmAction={vi.fn()} />
        )
        await userEvent.click(screen.getByText('Annuleren'))
        expect(onCancel).toHaveBeenCalledOnce()
    })

    it('roept onConfirmAction aan bij klikken op reset', async () => {
        const onConfirm = vi.fn()
        render(
            <BuilderResetConfirmModal isOpen={true} onCancelAction={vi.fn()} onConfirmAction={onConfirm} />
        )
        await userEvent.click(screen.getByText('Ja, reset scene'))
        expect(onConfirm).toHaveBeenCalledOnce()
    })

    it('roept onCancelAction aan bij klikken op backdrop', async () => {
        const onCancel = vi.fn()
        const { container } = render(
            <BuilderResetConfirmModal isOpen={true} onCancelAction={onCancel} onConfirmAction={vi.fn()} />
        )
        await userEvent.click(container.firstChild as HTMLElement)
        expect(onCancel).toHaveBeenCalledOnce()
    })

    it('sluit niet bij klikken op de modal zelf', async () => {
        const onCancel = vi.fn()
        render(
            <BuilderResetConfirmModal isOpen={true} onCancelAction={onCancel} onConfirmAction={vi.fn()} />
        )
        await userEvent.click(screen.getByText('Scene resetten?'))
        expect(onCancel).not.toHaveBeenCalled()
    })
})