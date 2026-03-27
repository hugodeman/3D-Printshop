// import createMollieClient from "@mollie/api-client"
//
// const mollieClient = createMollieClient({
//     apiKey: process.env.MOLLIE_API_KEY!,
// })
//
// export async function createPayment() {
//     const payment = await mollieClient.payments.create({
//         amount: {
//             currency: "EUR",
//             value: "10.00",
//         },
//         description: "3D Print Order",
//         redirectUrl: "http://localhost:3000/success",
//     })
//
//     return payment.getCheckoutUrl()
// }