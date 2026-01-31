/**
 * TSE Manager
 *
 * High-level service for managing TSE operations in the Chalk POS system.
 * Handles configuration loading, transaction signing, and error handling.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { FiskalyService, TseSignatureData } from './fiskaly-service'

export interface TseConfig {
    id: string
    organization_id: string
    api_key: string
    api_secret: string
    tss_id: string
    client_id: string
    is_active: boolean
    environment: 'sandbox' | 'production'
}

export class TseManager {
    private fiskalyService?: FiskalyService
    private config?: TseConfig

    /**
     * Initialize TSE for the current organization
     */
    async initialize(organizationId: string, supabaseClient?: SupabaseClient): Promise<boolean> {
        try {
            const supabase = supabaseClient || (await createClient())

            const { data, error } = await supabase
                .from('tse_configurations')
                .select('*')
                .eq('organization_id', organizationId)
                .eq('is_active', true)
                .single()

            if (error || !data) {
                console.warn(
                    '[TSE] No active TSE configuration found for organization:',
                    organizationId
                )
                return false
            }

            this.config = data as TseConfig

            this.fiskalyService = new FiskalyService({
                apiKey: this.config.api_key,
                apiSecret: this.config.api_secret,
                tssId: this.config.tss_id,
                clientId: this.config.client_id,
                environment: this.config.environment,
            })

            // Verify connection
            const isHealthy = await this.fiskalyService.healthCheck()
            if (!isHealthy) {
                console.error('[TSE] Health check failed')
                return false
            }

            // Initialize TSS if needed (important for sandbox)
            try {
                await this.fiskalyService.initializeTss()
            } catch (initError) {
                console.warn(
                    '[TSE] TSS initialization warning (may already be initialized):',
                    initError
                )
                // Don't fail if already initialized
            }

            // Ensure client is registered
            try {
                await this.fiskalyService.ensureClientRegistered()
            } catch (clientError) {
                console.error('[TSE] Failed to register client:', clientError)
                return false
            }

            // console.log('[TSE] Initialization complete')
            return true
        } catch (error) {
            console.error('[TSE] Failed to initialize TSE:', error)
            return false
        }
    }

    /**
     * Check if TSE is enabled and initialized
     */
    isEnabled(): boolean {
        return !!this.fiskalyService && !!this.config
    }

    /**
     * Sign a transaction with TSE
     */
    async signTransaction(
        transactionId: string,
        totalAmount: number,
        paymentMethod: 'cash' | 'card',
        items: Array<{ name: string; price: number; quantity: number; vat_rate?: number }>
    ): Promise<TseSignatureData | null> {
        if (!this.fiskalyService) {
            console.warn('[TSE] Not initialized, skipping signature')
            return null
        }

        try {
            // console.log('[TSE] Starting transaction:', transactionId)
            // Start transaction
            await this.fiskalyService.startTransaction(transactionId)
            // console.log('[TSE] Transaction started, finishing...')

            // Finish and get signature
            const signature = await this.fiskalyService.finishTransaction(
                transactionId,
                totalAmount,
                paymentMethod,
                items
            )

            // console.log('[TSE] Transaction finished successfully')
            return signature
        } catch (error) {
            console.error('[TSE] Failed to sign transaction:', error)
            if (error instanceof Error) {
                console.error('[TSE] Error message:', error.message)
                console.error('[TSE] Error stack:', error.stack)
            }
            // Check if it's an axios error
            if (typeof error === 'object' && error !== null && 'response' in error) {
                const axiosError = error as { response?: { data?: unknown; status?: number } }
                console.error('[TSE] Axios error response:', axiosError.response?.data)
                console.error('[TSE] Axios error status:', axiosError.response?.status)
            }
            // Don't throw - allow transaction to complete without TSE in case of errors
            return null
        }
    }

    /**
     * Cancel a TSE transaction
     */
    async cancelTransaction(transactionId: string): Promise<void> {
        if (!this.fiskalyService) {
            return
        }

        try {
            await this.fiskalyService.cancelTransaction(transactionId)
        } catch (error) {
            console.error('Failed to cancel TSE transaction:', error)
            // Don't throw - cancellation should proceed even if TSE fails
        }
    }

    /**
     * Export DSFinV-K data for tax audit
     */
    async exportDSFinVK(startDate: Date, endDate: Date): Promise<Blob | null> {
        if (!this.fiskalyService) {
            throw new Error('TSE not initialized')
        }

        try {
            return await this.fiskalyService.exportDSFinVK(startDate, endDate)
        } catch (error) {
            console.error('Failed to export DSFinV-K:', error)
            throw error
        }
    }

    /**
     * Get TSE configuration
     */
    getConfig(): TseConfig | undefined {
        return this.config
    }
}

// Map to store managers per organization
const tseManagers = new Map<string, TseManager>()

/**
 * Invalidate the cached TSE manager for an organization.
 * Call this when configuration changes.
 */
export function invalidateTseManager(organizationId: string) {
    tseManagers.delete(organizationId)
    // console.log(`TSE manager invalidated for organization: ${organizationId}`)
}

/**
 * Get or create TSE manager instance
 */
export async function getTseManager(organizationId: string): Promise<TseManager> {
    const existingManager = tseManagers.get(organizationId)

    // If we have an initialized and enabled manager, return it
    if (existingManager?.isEnabled()) {
        return existingManager
    }

    // Otherwise, create a new one and try to initialize
    // We don't cache the old one if it was disabled/broken
    const manager = new TseManager()
    const success = await manager.initialize(organizationId)

    if (success) {
        tseManagers.set(organizationId, manager)
    }

    return manager
}
