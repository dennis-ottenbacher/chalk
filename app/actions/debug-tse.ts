'use server'

import { createClient } from '@/utils/supabase/server'
import { getOrganizationId } from '@/lib/get-organization'
import { getTseManager } from '@/lib/tse/tse-manager'

export async function debugTseConfiguration() {
    const logs: string[] = []

    try {
        logs.push('=== TSE Configuration Debug ===')

        const supabase = await createClient()
        const organizationId = await getOrganizationId()

        logs.push(`✅ Organization ID: ${organizationId}`)

        // Get TSE config
        const { data: tseConfig, error: configError } = await supabase
            .from('tse_configurations')
            .select('*')
            .eq('organization_id', organizationId)
            .single()

        if (configError || !tseConfig) {
            logs.push(`❌ No TSE configuration found: ${configError?.message}`)
            return { success: false, logs }
        }

        logs.push('✅ TSE Config found:')
        logs.push(`   - TSS ID: ${tseConfig.tss_id}`)
        logs.push(`   - Client ID: ${tseConfig.client_id}`)
        logs.push(`   - Environment: ${tseConfig.environment}`)
        logs.push(`   - Is Active: ${tseConfig.is_active}`)
        logs.push(`   - Has API Key: ${!!tseConfig.api_key}`)
        logs.push(`   - Has API Secret: ${!!tseConfig.api_secret}`)

        // Test TSE Manager
        logs.push('')
        logs.push('=== Testing TSE Manager ===')

        const tseManager = await getTseManager(organizationId)
        logs.push('✅ TSE Manager created')

        const isEnabled = tseManager.isEnabled()
        logs.push(`   - Is Enabled: ${isEnabled}`)

        if (!isEnabled) {
            logs.push('❌ TSE Manager is not enabled!')
            const config = tseManager.getConfig()
            logs.push(`   - Config exists: ${!!config}`)
            return { success: false, logs }
        }

        // Try to sign a test transaction
        logs.push('')
        logs.push('=== Testing Transaction Signing ===')

        const testTransactionId = `test-${Date.now()}`
        logs.push(`Test Transaction ID: ${testTransactionId}`)

        try {
            const signature = await tseManager.signTransaction(testTransactionId, 10.0, 'cash', [
                { name: 'Test Item', price: 10.0, quantity: 1, vat_rate: 19 },
            ])

            if (signature) {
                logs.push('✅ Transaction signed successfully!')
                logs.push(`   - Transaction Number: ${signature.transaction_number}`)
                logs.push(`   - Signature Counter: ${signature.signature_counter}`)
                logs.push(`   - TSS ID: ${signature.tss_id}`)
                logs.push(`   - Client ID: ${signature.client_id}`)
                return { success: true, logs, signature }
            } else {
                logs.push('❌ Signing returned null')
                logs.push('   Check server console for detailed error logs')
                return { success: false, logs }
            }
        } catch (signError) {
            logs.push(
                `❌ Signing error: ${signError instanceof Error ? signError.message : String(signError)}`
            )
            if (signError instanceof Error && signError.stack) {
                logs.push(`   Stack: ${signError.stack.split('\n').slice(0, 3).join('\n   ')}`)
            }
            // Check for axios error details
            if (typeof signError === 'object' && signError !== null && 'response' in signError) {
                const axiosError = signError as {
                    response?: { data?: unknown; status?: number; statusText?: string }
                }
                if (axiosError.response) {
                    logs.push(
                        `   HTTP Status: ${axiosError.response.status} ${axiosError.response.statusText || ''}`
                    )
                    logs.push(`   Response: ${JSON.stringify(axiosError.response.data, null, 2)}`)
                }
            }
            return { success: false, logs, error: signError }
        }
    } catch (error) {
        logs.push(`❌ Fatal error: ${error instanceof Error ? error.message : String(error)}`)
        return { success: false, logs, error }
    }
}
