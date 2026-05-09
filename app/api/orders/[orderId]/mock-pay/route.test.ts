// api/orders/[orderId]/mock-pay/route.test.ts
import { POST } from './route'
import prisma from '@/lib/prisma'
import { isMollieConfigured } from '@/lib/mollie'

vi.mock('@/lib/prisma', () => ({
    default: {
        payment: { findUnique: vi.fn(), update: vi.fn() },
        order: { update: vi.fn() },
        $transaction: vi.fn(),
    },
}))
vi.mock('@/lib/mollie', () => ({ isMollieConfigured: vi.fn() }))

const makeRequest = (orderId: string) =>
    new Request(`http://localhost/api/orders/${orderId}/mock-pay`, { method: 'POST' })

const makeParams = (orderId: string) =>
    ({ params: Promise.resolve({ orderId }) }) as never

beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    process.env.NODE_ENV = 'test'
    vi.mocked(isMollieConfigured).mockReturnValue(false)
})

describe('POST /api/orders/[orderId]/mock-pay', () => {
    it('geeft 404 als payment niet bestaat', async () => {
        vi.mocked(prisma.payment.findUnique).mockResolvedValue(null)
        const res = await POST(makeRequest('order-123') as never, makeParams('order-123'))
        expect(res.status).toBe(404)
    })

    it('geeft 400 als Mollie geconfigureerd is en geen mock payment', async () => {
        vi.mocked(prisma.payment.findUnique).mockResolvedValue({ mollieId: 'tr_real' } as never)
        vi.mocked(isMollieConfigured).mockReturnValue(true)
        const res = await POST(makeRequest('order-123') as never, makeParams('order-123'))
        expect(res.status).toBe(400)
    })

    it('markeert order als PAID bij succesvolle mock betaling', async () => {
        vi.mocked(prisma.payment.findUnique).mockResolvedValue({ mollieId: 'mock-123' } as never)
        vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as never)
        const res = await POST(makeRequest('order-123') as never, makeParams('order-123'))
        expect(res.status).toBe(200)
        expect(prisma.$transaction).toHaveBeenCalled()
    })
})