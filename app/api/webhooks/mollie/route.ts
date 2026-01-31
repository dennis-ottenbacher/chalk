import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { MollieService } from '@/lib/payments/mollie-service'

/**
 * Mollie Webhook Handler
 *
 * Receives payment status updates from Mollie.
 * Organization is determined via subdomain (x-organization-id header from middleware).
 *
 * @see https://docs.mollie.com/overview/webhooks
 */
export async function POST(request: NextRequest) {
    try {
        // Get organization ID from middleware header
        const organizationId = request.headers.get('x-organization-id')

        if (!organizationId) {
            console.error('[Mollie Webhook] No organization ID found')
            return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
        }

        // Parse Mollie webhook payload
        const formData = await request.formData()
        const molliePaymentId = formData.get('id') as string

        if (!molliePaymentId) {
            console.error('[Mollie Webhook] No payment ID in webhook')
            return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 })
        }

        console.warn(
            `[Mollie Webhook] Received for payment: ${molliePaymentId}, org: ${organizationId}`
        )

        const supabase = await createClient()

        // Get payment configuration for this organization
        const { data: paymentConfig, error: configError } = await supabase
            .from('payment_configurations')
            .select('mollie_api_key, mollie_test_mode')
            .eq('organization_id', organizationId)
            .single()

        if (configError || !paymentConfig?.mollie_api_key) {
            console.error('[Mollie Webhook] No Mollie config for organization')
            return NextResponse.json({ error: 'Mollie not configured' }, { status: 400 })
        }

        // Fetch payment status from Mollie
        const mollieService = new MollieService({
            apiKey: paymentConfig.mollie_api_key,
            testMode: paymentConfig.mollie_test_mode,
        })

        const payment = await mollieService.getPayment(molliePaymentId)

        console.warn(`[Mollie Webhook] Payment status: ${payment.status}`)

        // Update mollie_payments record
        const { data: existingPayment } = await supabase
            .from('mollie_payments')
            .select('id, transaction_id')
            .eq('mollie_id', molliePaymentId)
            .eq('organization_id', organizationId)
            .single()

        if (existingPayment) {
            await supabase
                .from('mollie_payments')
                .update({
                    status: payment.status,
                    method: payment.method,
                    paid_at: payment.paidAt,
                })
                .eq('id', existingPayment.id)

            // If payment is paid and has a transaction, finalize it with TSE
            if (payment.status === 'paid' && existingPayment.transaction_id) {
                await finalizeTransaction(supabase, existingPayment.transaction_id, organizationId)
            }
        } else {
            // Create new mollie_payments record if it doesn't exist
            await supabase.from('mollie_payments').insert({
                organization_id: organizationId,
                mollie_id: molliePaymentId,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                method: payment.method,
                paid_at: payment.paidAt,
            })
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('[Mollie Webhook] Error:', error)
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
}

/**
 * Finalize a transaction with TSE signing
 */
async function finalizeTransaction(
    supabase: Awaited<ReturnType<typeof createClient>>,
    transactionId: string,
    organizationId: string
) {
    try {
        // Get transaction data
        const { data: transaction } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .single()

        if (!transaction || transaction.status !== 'pending') {
            console.warn('[Mollie Webhook] Transaction not found or not pending')
            return
        }

        // Sign with TSE
        try {
            const { getTseManager } = await import('@/lib/tse/tse-manager')
            const tseManager = await getTseManager(organizationId)

            if (tseManager.isEnabled()) {
                console.warn('[Mollie Webhook] Signing transaction with TSE...')

                const tseSignature = await tseManager.signTransaction(
                    transactionId,
                    transaction.total_amount,
                    'card', // Mollie payments are always CARD for TSE
                    transaction.items.map(
                        (item: { name: string; price: number; quantity: number }) => ({
                            name: item.name,
                            price: item.price,
                            quantity: item.quantity,
                            vat_rate: 19,
                        })
                    )
                )

                if (tseSignature) {
                    await supabase
                        .from('transactions')
                        .update({
                            status: 'completed',
                            tse_data: tseSignature,
                        })
                        .eq('id', transactionId)

                    console.warn('[Mollie Webhook] Transaction completed with TSE signature')
                    return
                }
            }
        } catch (tseError) {
            console.error('[Mollie Webhook] TSE signing failed:', tseError)
        }

        // Update status to completed even without TSE
        await supabase.from('transactions').update({ status: 'completed' }).eq('id', transactionId)

        console.warn('[Mollie Webhook] Transaction completed (without TSE)')
    } catch (error) {
        console.error('[Mollie Webhook] Failed to finalize transaction:', error)
    }
}
