/**
 * Mollie Payment Service
 *
 * Handles all interactions with the Mollie Payments API.
 * Provides payment creation, status checking, and method listing.
 *
 * @see https://docs.mollie.com/reference/v2/payments-api/overview
 */

import createMollieClient, { MollieClient, Payment, Method } from '@mollie/api-client'

export interface MollieConfig {
    apiKey: string
    testMode: boolean
}

export interface CreatePaymentOptions {
    amount: number
    currency?: string
    description: string
    redirectUrl: string
    webhookUrl: string
    metadata?: Record<string, unknown>
}

export interface MolliePaymentResult {
    id: string
    status: string
    checkoutUrl: string | null
    amount: number
    currency: string
    method: string | null
    createdAt: string
    paidAt: string | null
}

export interface ConnectionTestResult {
    success: boolean
    logs: string[]
    availableMethods?: string[]
    error?: string
}

export class MollieService {
    private client: MollieClient
    private config: MollieConfig

    constructor(config: MollieConfig) {
        this.config = config
        this.client = createMollieClient({ apiKey: config.apiKey })
    }

    /**
     * Test connection to Mollie API with step-by-step logging
     */
    async testConnection(): Promise<ConnectionTestResult> {
        const logs: string[] = []

        try {
            logs.push('=== Mollie Connection Test ===')
            logs.push(`   Mode: ${this.config.testMode ? 'Test' : 'Live'}`)
            logs.push(`   API Key: ${this.config.apiKey.substring(0, 10)}...`)

            // Step 1: Test API connection by listing methods
            logs.push('')
            logs.push('=== Step 1: Check API Connection ===')

            const methods = await this.client.methods.list()
            const methodsArray = Array.from(methods)
            logs.push('✅ API connection successful')
            logs.push(`   Available methods: ${methodsArray.length}`)

            // Step 2: List available payment methods
            logs.push('')
            logs.push('=== Step 2: Available Payment Methods ===')

            const availableMethods: string[] = []
            for (const method of methods) {
                availableMethods.push(method.id)
                logs.push(`   ✓ ${method.description} (${method.id})`)
            }

            // Step 3: Create test payment (only in test mode)
            if (this.config.testMode) {
                logs.push('')
                logs.push('=== Step 3: Test Payment Creation ===')

                try {
                    const testPayment = await this.client.payments.create({
                        amount: {
                            currency: 'EUR',
                            value: '0.01',
                        },
                        description: 'Chalk POS Connection Test',
                        redirectUrl: 'https://example.com/test-redirect',
                        webhookUrl: 'https://example.com/test-webhook',
                    })

                    logs.push('✅ Test payment created successfully')
                    logs.push(`   Payment ID: ${testPayment.id}`)
                    logs.push(`   Status: ${testPayment.status}`)

                    // Cancel the test payment if possible
                    if (testPayment.isCancelable) {
                        await this.client.payments.cancel(testPayment.id)
                        logs.push('   Test payment canceled')
                    }
                } catch (paymentError) {
                    logs.push('⚠️  Test payment creation skipped')
                    logs.push(
                        `   Reason: ${paymentError instanceof Error ? paymentError.message : 'Unknown error'}`
                    )
                    logs.push('   (This is normal for some API key configurations)')
                }
            } else {
                logs.push('')
                logs.push('=== Step 3: Skipped ===')
                logs.push('   Test payment skipped in live mode')
            }

            logs.push('')
            logs.push('=== Test Complete ===')
            logs.push('✅ Mollie connection verified successfully!')

            return {
                success: true,
                logs,
                availableMethods,
            }
        } catch (error) {
            logs.push('')
            logs.push('❌ Connection test failed')
            const errorMessage = error instanceof Error ? error.message : String(error)
            logs.push(`   Error: ${errorMessage}`)

            return {
                success: false,
                logs,
                error: errorMessage,
            }
        }
    }

    /**
     * Create a new payment
     */
    async createPayment(options: CreatePaymentOptions): Promise<MolliePaymentResult> {
        const payment = await this.client.payments.create({
            amount: {
                currency: options.currency || 'EUR',
                value: options.amount.toFixed(2),
            },
            description: options.description,
            redirectUrl: options.redirectUrl,
            webhookUrl: options.webhookUrl,
            metadata: options.metadata,
        })

        return this.formatPaymentResult(payment)
    }

    /**
     * Get payment by ID
     */
    async getPayment(paymentId: string): Promise<MolliePaymentResult> {
        const payment = await this.client.payments.get(paymentId)
        return this.formatPaymentResult(payment)
    }

    /**
     * List available payment methods
     */
    async listMethods(): Promise<Method[]> {
        const methods = await this.client.methods.list()
        return Array.from(methods)
    }

    /**
     * Check if payment is paid
     */
    async isPaymentPaid(paymentId: string): Promise<boolean> {
        const payment = await this.client.payments.get(paymentId)
        return payment.status === 'paid'
    }

    /**
     * Health check for Mollie connection
     */
    async healthCheck(): Promise<boolean> {
        try {
            await this.client.methods.list()
            return true
        } catch {
            return false
        }
    }

    /**
     * Format payment result
     */
    private formatPaymentResult(payment: Payment): MolliePaymentResult {
        return {
            id: payment.id,
            status: payment.status,
            checkoutUrl: payment._links?.checkout?.href || null,
            amount: parseFloat(payment.amount.value),
            currency: payment.amount.currency,
            method: payment.method || null,
            createdAt: payment.createdAt,
            paidAt: payment.paidAt || null,
        }
    }
}
