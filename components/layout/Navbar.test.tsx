import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Navbar } from './Navbar'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
    usePathname: vi.fn().mockReturnValue('/'),
}))

vi.mock('next-auth/react', () => ({
    useSession: vi.fn(),
}))

describe('Navbar', () => {

    beforeEach(() => {
        mockPush.mockClear()
    })

    describe('navigatieknoppen', () => {
        beforeEach(() => {
            vi.mocked(useSession).mockReturnValue({ data: null, status: 'unauthenticated', update: vi.fn() })
        })

        it('rendert de drie hoofdknoppen', () => {
            render(<Navbar />)
            expect(screen.getByText('Webshop')).toBeInTheDocument()
            expect(screen.getByText('Offerte maken')).toBeInTheDocument()
            expect(screen.getByText('3D Builder')).toBeInTheDocument()
        })

        it('navigeert naar /shop bij klikken op Webshop', async () => {
            render(<Navbar />)
            await userEvent.click(screen.getByText('Webshop'))
            expect(mockPush).toHaveBeenCalledWith('/shop')
        })

        it('navigeert naar de homepage bij klikken op het logo', async () => {
            render(<Navbar />)
            await userEvent.click(screen.getByText('HoekvanNoek'))
            expect(mockPush).toHaveBeenCalledWith('/')
        })
    })

    describe('actieve route', () => {
        it('markeert de Webshop knop als actief op /shop', () => {
            vi.mocked(useSession).mockReturnValue({ data: null, status: 'unauthenticated', update: vi.fn() })
            vi.mocked(usePathname).mockReturnValue('/shop')

            render(<Navbar />)
            expect(screen.getByText('Webshop')).toHaveClass('bg-button-secondary-active')
        })
    })

    describe('sessie states', () => {
        it('toont Login knop als uitgelogd', () => {
            vi.mocked(useSession).mockReturnValue({ data: null, status: 'unauthenticated', update: vi.fn() })
            render(<Navbar />)
            expect(screen.getByText('Login')).toBeInTheDocument()
        })

        it('toont lege placeholder tijdens laden', () => {
            vi.mocked(useSession).mockReturnValue({ data: null, status: 'loading', update: vi.fn() })
            render(<Navbar />)
            expect(screen.queryByText('Login')).not.toBeInTheDocument()
            expect(screen.queryByText('Profiel')).not.toBeInTheDocument()
        })

        it('toont Profiel als ingelogd', () => {
            vi.mocked(useSession).mockReturnValue({
                data: { user: { id: '1', name: 'Test', role: 'user' }, expires: '' },
                status: 'authenticated',
                update: vi.fn(),
            })
            render(<Navbar />)
            expect(screen.getByText('Profiel')).toBeInTheDocument()
        })

        it('navigeert naar /profile bij klikken op Profiel', async () => {
            vi.mocked(useSession).mockReturnValue({
                data: { user: { id: '1', name: 'Test', role: 'user' }, expires: '' },
                status: 'authenticated',
                update: vi.fn(),
            })
            render(<Navbar />)
            await userEvent.click(screen.getByText('Profiel'))
            expect(mockPush).toHaveBeenCalledWith('/profile')
        })
    })
})