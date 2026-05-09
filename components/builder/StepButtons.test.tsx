import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StepButtons } from './StepButtons'

const defaultSteps = [
    { id: 1, label: 'Platform', isCurrent: true },
    { id: 2, label: 'Decoraties', disabled: true },
]

describe('StepButtons', () => {
    it('rendert alle stappen', () => {
        render(<StepButtons steps={defaultSteps} />)
        expect(screen.getByText('Stap 1: Platform')).toBeInTheDocument()
        expect(screen.getByText('Stap 2: Decoraties')).toBeInTheDocument()
    })

    it('roept onClick aan bij klikken op een stap', async () => {
        const onClick = vi.fn()
        const steps = [{ id: 1, label: 'Platform', isCurrent: true, onClick }]
        render(<StepButtons steps={steps} />)

        await userEvent.click(screen.getByText('Stap 1: Platform'))
        expect(onClick).toHaveBeenCalledOnce()
    })

    it('toont de trash knop als onClearClick meegegeven is', () => {
        render(<StepButtons steps={defaultSteps} onClearClick={vi.fn()} />)
        expect(screen.getByLabelText('Leeg scene')).toBeInTheDocument()
    })

    it('toont de info knop als onInfoClick meegegeven is', () => {
        render(<StepButtons steps={defaultSteps} onInfoClick={vi.fn()} />)
        expect(screen.getByLabelText('Toon builder uitleg')).toBeInTheDocument()
    })

    it('toont geen knoppen als noch onClearClick noch onInfoClick meegegeven is', () => {
        render(<StepButtons steps={defaultSteps} />)
        expect(screen.queryByLabelText('Leeg scene')).not.toBeInTheDocument()
        expect(screen.queryByLabelText('Toon builder uitleg')).not.toBeInTheDocument()
    })

    it('roept onClearClick aan bij klikken op trash', async () => {
        const onClear = vi.fn()
        render(<StepButtons steps={defaultSteps} onClearClick={onClear} />)
        await userEvent.click(screen.getByLabelText('Leeg scene'))
        expect(onClear).toHaveBeenCalledOnce()
    })

    it('trash knop is disabled als clearDisabled true is', () => {
        render(<StepButtons steps={defaultSteps} onClearClick={vi.fn()} clearDisabled={true} />)
        expect(screen.getByLabelText('Leeg scene')).toBeDisabled()
    })

    it('toont checkmark icoon bij done stap', () => {
        const steps = [{ id: 1, label: 'Platform', done: true }]
        const { container } = render(<StepButtons steps={steps} />)
        expect(container.querySelector('svg')).toBeInTheDocument()
    })
})