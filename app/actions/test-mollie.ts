'use server'

import { createClient } from '@/utils/supabase/server'
import { getOrganizationId } from '@/lib/get-organization'
import { MollieService } from '@/lib/payments/mollie-service'

/**
 * Test Mollie connection with step-by-step logging
 * Similar to testFiskalyDirectly() for TSE
 */
export async function testMollieConnection() {
    const logs: string[] = []

    try {
        logs.push('=== Mollie API Test ===')

        const supabase = await createClient()
        const organizationId = await getOrganizationId()

        // Get Payment config
        const { data: paymentConfig, error: configError } = await supabase
            .from('payment_configurations')
            .select('*')
            .eq('organization_id', organizationId)
            .single()

        if (configError || !paymentConfig) {
            logs.push('❌ No payment configuration found')
            logs.push('   Please configure Mollie in Settings → Payments')
            return { success: false, logs }
        }

        if (!paymentConfig.mollie_api_key) {
            logs.push('❌ Mollie API Key not configured')
            return { success: false, logs }
        }

        logs.push('✅ Config loaded')
        logs.push(`   Mode: ${paymentConfig.mollie_test_mode ? 'Test' : 'Live'}`)
        logs.push(`   Enabled: ${paymentConfig.mollie_enabled ? 'Yes' : 'No'}`)
        logs.push(`   API Key: ${paymentConfig.mollie_api_key.substring(0, 10)}...`)

        // Initialize Mollie service
        const mollieService = new MollieService({
            apiKey: paymentConfig.mollie_api_key,
            testMode: paymentConfig.mollie_test_mode,
        })

        // Run connection test
        const result = await mollieService.testConnection()

        // Merge logs
        logs.push(...result.logs.slice(1)) // Skip the header line (already added)

        return {
            success: result.success,
            logs,
            availableMethods: result.availableMethods,
        }
    } catch (error) {
        logs.push('❌ Fatal error')
        logs.push(`   ${error instanceof Error ? error.message : String(error)}`)
        return { success: false, logs, error }
    }
}

/**
 * Get current Mollie/Payment configuration status
 */
export async function getPaymentStatus() {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { data: config } = await supabase
        .from('payment_configurations')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

    if (!config) {
        return {
            configured: false,
            enabled: false,
            cardProvider: 'standalone' as const,
            mollieTestMode: true,
            mollieHasKey: false,
            availableMethods: [],
        }
    }

    let availableMethods: string[] = []

    // Fetch available methods if Mollie is configured
    if (config.mollie_api_key && config.mollie_enabled) {
        try {
            const mollieService = new MollieService({
                apiKey: config.mollie_api_key,
                testMode: config.mollie_test_mode,
            })
            const methods = await mollieService.listMethods()
            availableMethods = methods.map(m => m.id)
        } catch {
            // Ignore errors, just return empty methods
        }
    }

    return {
        configured: true,
        enabled: config.mollie_enabled,
        cardProvider: config.card_provider as 'standalone' | 'mollie',
        mollieTestMode: config.mollie_test_mode,
        mollieHasKey: !!config.mollie_api_key,
        availableMethods,
    }
}
