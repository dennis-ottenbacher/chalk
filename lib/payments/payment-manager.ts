/**
 * Payment Manager
 *
 * Orchestrates payment processing for an organization.
 * Determines which payment provider to use based on configuration
 * and handles the integration between Mollie and TSE.
 */

import { createClient } from '@/utils/supabase/server'
import { MollieService, MolliePaymentResult, ConnectionTestResult } from './mollie-service'

export interface PaymentConfig {
    id: string
    organizationId: string
    cardProvider: 'standalone' | 'mollie'
    mollieApiKey: string | null
    mollieTestMode: boolean
    mollieEnabled: boolean
    createdAt: string
    updatedAt: string
}

// Cache for payment managers (per organization)
const managerCache = new Map<string, { manager: PaymentManager; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get or create a PaymentManager for an organization
 */
export async function getPaymentManager(organizationId: string): Promise<PaymentManager> {
    // Check cache
    const cached = managerCache.get(organizationId)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.manager
    }

    // Load config from database
    const supabase = await createClient()
    const { data: config } = await supabase
        .from('payment_configurations')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

    const manager = new PaymentManager(organizationId, config)

    // Cache the manager
    managerCache.set(organizationId, { manager, timestamp: Date.now() })

    return manager
}

/**
 * Clear cached manager for an organization (call after config update)
 */
export function clearPaymentManagerCache(organizationId: string): void {
    managerCache.delete(organizationId)
}

export class PaymentManager {
    private organizationId: string
    private config: PaymentConfig | null
    private mollieService: MollieService | null = null

    constructor(
        organizationId: string,
        config: {
            id: string
            organization_id: string
            card_provider: 'standalone' | 'mollie'
            mollie_api_key: string | null
            mollie_test_mode: boolean
            mollie_enabled: boolean
            created_at: string
            updated_at: string
        } | null
    ) {
        this.organizationId = organizationId

        if (config) {
            this.config = {
                id: config.id,
                organizationId: config.organization_id,
                cardProvider: config.card_provider,
                mollieApiKey: config.mollie_api_key,
                mollieTestMode: config.mollie_test_mode,
                mollieEnabled: config.mollie_enabled,
                createdAt: config.created_at,
                updatedAt: config.updated_at,
            }
        } else {
            this.config = null
        }

        // Initialize Mollie service if configured
        if (this.config?.mollieApiKey && this.config.mollieEnabled) {
            this.mollieService = new MollieService({
                apiKey: this.config.mollieApiKey,
                testMode: this.config.mollieTestMode,
            })
        }
    }

    /**
     * Get the configured card payment provider
     */
    getCardProvider(): 'standalone' | 'mollie' {
        return this.config?.cardProvider || 'standalone'
    }

    /**
     * Check if Mollie is enabled
     */
    isMollieEnabled(): boolean {
        return this.config?.mollieEnabled || false
    }

    /**
     * Check if Mollie is configured (has API key)
     */
    isMollieConfigured(): boolean {
        return !!this.config?.mollieApiKey
    }

    /**
     * Get the raw config (for display purposes)
     */
    getConfig(): PaymentConfig | null {
        return this.config
    }

    /**
     * Test Mollie connection
     */
    async testMollieConnection(): Promise<ConnectionTestResult> {
        if (!this.mollieService) {
            return {
                success: false,
                logs: ['Mollie is not configured or enabled'],
                error: 'Mollie not configured',
            }
        }

        return this.mollieService.testConnection()
    }

    /**
     * Create a Mollie payment
     */
    async createMolliePayment(
        amount: number,
        description: string,
        redirectUrl: string,
        webhookUrl: string,
        metadata?: Record<string, unknown>
    ): Promise<MolliePaymentResult> {
        if (!this.mollieService) {
            throw new Error('Mollie is not configured or enabled')
        }

        return this.mollieService.createPayment({
            amount,
            description,
            redirectUrl,
            webhookUrl,
            metadata,
        })
    }

    /**
     * Get a Mollie payment by ID
     */
    async getMolliePayment(paymentId: string): Promise<MolliePaymentResult> {
        if (!this.mollieService) {
            throw new Error('Mollie is not configured or enabled')
        }

        return this.mollieService.getPayment(paymentId)
    }

    /**
     * Check if a Mollie payment is paid
     */
    async isMolliePaymentPaid(paymentId: string): Promise<boolean> {
        if (!this.mollieService) {
            throw new Error('Mollie is not configured or enabled')
        }

        return this.mollieService.isPaymentPaid(paymentId)
    }

    /**
     * List available Mollie payment methods
     */
    async listMollieMethods(): Promise<string[]> {
        if (!this.mollieService) {
            return []
        }

        const methods = await this.mollieService.listMethods()
        return methods.map(m => m.id)
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<{ mollie: boolean }> {
        const mollieHealth = this.mollieService ? await this.mollieService.healthCheck() : false

        return { mollie: mollieHealth }
    }
}
