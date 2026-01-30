import { createClient } from '@/utils/supabase/server'
import { getTseManager } from '@/lib/tse/tse-manager'

async function testTSE() {
    console.log('=== TSE Configuration Test ===\n')

    const supabase = await createClient()

    // Get user
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
        console.error('❌ Not authenticated')
        return
    }

    // Get organization
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single()

    if (!profile) {
        console.error('❌ No profile found')
        return
    }

    const organizationId = profile.organization_id
    console.log('✅ Organization ID:', organizationId)

    // Get TSE config
    const { data: tseConfig } = await supabase
        .from('tse_configurations')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

    if (!tseConfig) {
        console.error('❌ No TSE configuration found')
        return
    }

    console.log('✅ TSE Config found:')
    console.log('   - TSS ID:', tseConfig.tss_id)
    console.log('   - Client ID:', tseConfig.client_id)
    console.log('   - Environment:', tseConfig.environment)
    console.log('   - Is Active:', tseConfig.is_active)
    console.log('   - Has API Key:', !!tseConfig.api_key)
    console.log('   - Has API Secret:', !!tseConfig.api_secret)

    // Test TSE Manager
    console.log('\n=== Testing TSE Manager ===\n')

    try {
        const tseManager = await getTseManager(organizationId)
        console.log('✅ TSE Manager created')

        const isEnabled = tseManager.isEnabled()
        console.log('   - Is Enabled:', isEnabled)

        if (!isEnabled) {
            console.error('❌ TSE Manager is not enabled!')
            const config = tseManager.getConfig()
            console.log('   - Config exists:', !!config)
            return
        }

        // Try to sign a test transaction
        console.log('\n=== Testing Transaction Signing ===\n')

        const testTransactionId = `test-${Date.now()}`
        console.log('Test Transaction ID:', testTransactionId)

        const signature = await tseManager.signTransaction(testTransactionId, 10.0, 'cash', [
            { name: 'Test Item', price: 10.0, quantity: 1, vat_rate: 19 },
        ])

        if (signature) {
            console.log('✅ Transaction signed successfully!')
            console.log('   - Transaction Number:', signature.transaction_number)
            console.log('   - Signature Counter:', signature.signature_counter)
            console.log('   - TSS ID:', signature.tss_id)
            console.log('   - Client ID:', signature.client_id)
        } else {
            console.error('❌ Signing returned null')
        }
    } catch (error) {
        console.error('❌ Error:', error)
        if (error instanceof Error) {
            console.error('   Message:', error.message)
            console.error('   Stack:', error.stack)
        }
    }
}

testTSE().catch(console.error)
