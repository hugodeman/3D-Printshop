import createMollieClient from "@mollie/api-client"

function getBaseUrl() {
	return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
}

function getMollieApiKey() {
	return process.env.MOLLIE_API_KEY?.trim() ?? ""
}

export function isMollieConfigured() {
	const apiKey = getMollieApiKey()
	return apiKey.startsWith("test_") || apiKey.startsWith("live_")
}

export function getMollieClient() {
	return createMollieClient({ apiKey: getMollieApiKey() })
}

/**
 * Creates a Mollie payment and returns the checkout URL.
 * @param orderId     - The internal Order ID (stored as metadata)
 * @param total       - Total in euros formatted as "25.00"
 * @param description - Human-readable description shown in Mollie
 */
export async function createMolliePayment(
	orderId: string,
	total: string,
	description: string,
): Promise<{ mollieId: string; checkoutUrl: string }> {
	const baseUrl = getBaseUrl()

	if (!isMollieConfigured()) {
		return {
			mollieId: `mock-${orderId}`,
			checkoutUrl: `${baseUrl}/checkout/payment?orderId=${orderId}&mock=1`,
		}
	}

	try {
		const mollie = getMollieClient()

		const payment = await mollie.payments.create({
			amount: { currency: "EUR", value: total },
			description,
			// User is sent here after payment (paid or failed)
			redirectUrl: `${baseUrl}/checkout/payment?orderId=${orderId}`,
			// Mollie POSTs payment status updates here (server-to-server)
			webhookUrl: `${baseUrl}/api/mollie`,
			metadata: { orderId },
		})

		const checkoutUrl = payment.getCheckoutUrl()
		if (!checkoutUrl) {
			console.warn("[mollie] Falling back to local checkout: Mollie did not return a checkout URL")
			return {
				mollieId: `mock-${orderId}`,
				checkoutUrl: `${baseUrl}/checkout/payment?orderId=${orderId}&mock=1`,
			}
		}

		return { mollieId: payment.id, checkoutUrl }
	} catch (error) {
		console.warn("[mollie] Falling back to local checkout:", error)
		return {
			mollieId: `mock-${orderId}`,
			checkoutUrl: `${baseUrl}/checkout/payment?orderId=${orderId}&mock=1`,
		}
	}
}
