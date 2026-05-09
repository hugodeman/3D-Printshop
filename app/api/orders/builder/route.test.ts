import { POST } from './route'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createMolliePayment } from '@/lib/mollie'
import { generateAndSavePrintFile } from '@/lib/builder-print-export'
import type { BuilderCheckoutDraft } from '@/lib/builder-checkout-draft'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
    default: {
        builderItem: { create: vi.fn() },
        order: { create: vi.fn() },
        payment: { create: vi.fn() },
        $executeRaw: vi.fn(),
    },
}))
vi.mock('@/lib/mollie', () => ({
    createMolliePayment: vi.fn(),
}))
vi.mock('@/lib/builder-print-export', () => ({
    generateAndSavePrintFile: vi.fn(),
}))

const mockDraft: BuilderCheckoutDraft = {
    platformId: 'square-model',
    platformName: 'Vierkant',
    platformSize: 10,
    platformColor: '#228B22',
    decorations: [],
    totalItems: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
}

const makeRequest = (body: object) =>
    new Request('http://localhost/api/orders/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })

beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(generateAndSavePrintFile).mockResolvedValue('order-123.3mf')
    vi.mocked(prisma.builderItem.create).mockResolvedValue({ id: 'item-1' } as never)
    vi.mocked(prisma.order.create).mockResolvedValue({ id: 'order-123', total: '20.00' } as never)
    vi.mocked(prisma.payment.create).mockResolvedValue({} as never)
    vi.mocked(createMolliePayment).mockResolvedValue({
        mollieId: 'tr_mock',
        checkoutUrl: 'https://mollie.com/pay/mock',
    })
})

describe('POST /api/orders/builder', () => {
    it('geeft 401 terug als niet ingelogd', async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        vi.mocked(auth).mockResolvedValue(null)
        const res = await POST(makeRequest(mockDraft) as never)
        expect(res.status).toBe(401)
    })

    it('berekent prijs correct voor M platform zonder decoraties', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
        await POST(makeRequest(mockDraft) as never)
        expect(prisma.order.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ total: '20.00' }),
            })
        )
    })

    it('berekent prijs correct voor L platform met 2 decoraties', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
        const draft = {
            ...mockDraft,
            platformSize: 15,
            decorations: [
                { instanceId: 'tree-1', assetId: 'tree-model', name: 'Boom', position: [0,0,0], rotationY: 0, scale: 1, color: '#fff' },
                { instanceId: 'tree-2', assetId: 'tree-model', name: 'Boom', position: [1,0,0], rotationY: 0, scale: 1, color: '#fff' },
            ],
        }
        await POST(makeRequest(draft) as never)
        // €25 + 2 * €5 = €35
        expect(prisma.order.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ total: '35.00' }),
            })
        )
    })

    it('geeft checkoutUrl terug bij succes', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
        const res = await POST(makeRequest(mockDraft) as never)
        const data = await res.json()
        expect(res.status).toBe(200)
        expect(data.checkoutUrl).toBe('https://mollie.com/pay/mock')
    })

    it('maakt order aan zonder printfile als export faalt', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
        vi.mocked(generateAndSavePrintFile).mockRejectedValue(new Error('export fout'))
        const res = await POST(makeRequest(mockDraft) as never)
        // Order nog steeds aangemaakt
        expect(prisma.order.create).toHaveBeenCalled()
        expect(res.status).toBe(200)
    })
})