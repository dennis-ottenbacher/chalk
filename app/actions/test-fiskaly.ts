'use server'

import { createClient } from '@/utils/supabase/server'
import { getOrganizationId } from '@/lib/get-organization'

export async function testFiskalyDirectly() {
    const logs: string[] = []

    try {
        logs.push('=== Direct Fiskaly API Test ===')

        const supabase = await createClient()
        const organizationId = await getOrganizationId()

        // Get TSE config
        const { data: tseConfig, error: configError } = await supabase
            .from('tse_configurations')
            .select('*')
            .eq('organization_id', organizationId)
            .single()

        if (configError || !tseConfig) {
            logs.push(`❌ No TSE configuration found`)
            return { success: false, logs }
        }

        logs.push('✅ Config loaded')
        logs.push(`   Environment: ${tseConfig.environment}`)
        logs.push(`   TSS ID: ${tseConfig.tss_id}`)
        logs.push(`   Client ID: ${tseConfig.client_id}`)

        // Import axios and test directly
        const axios = (await import('axios')).default

        const baseUrl = 'https://kassensichv-middleware.fiskaly.com/api/v2'
        logs.push(`   Base URL: ${baseUrl}`)

        // Step 1: Authenticate
        logs.push('')
        logs.push('=== Step 1: Authentication ===')

        const authResponse = await axios.post(
            `${baseUrl}/auth`,
            {
                api_key: tseConfig.api_key,
                api_secret: tseConfig.api_secret,
            },
            {
                headers: { 'Content-Type': 'application/json' },
            }
        )

        const token = authResponse.data.access_token
        logs.push('✅ Authentication successful')
        logs.push(`   Token: ${token.substring(0, 20)}...`)

        // Step 2: Check TSS
        logs.push('')
        logs.push('=== Step 2: Check TSS ===')

        const tssResponse = await axios.get(`${baseUrl}/tss/${tseConfig.tss_id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })

        let tssState = tssResponse.data.state
        logs.push('✅ TSS found')
        logs.push(`   State: ${tssState}`)

        // Step 3: Setup TSS based on current state
        logs.push('')
        logs.push('=== Step 3: Setup TSS ===')
        logs.push(`   Current TSS State: ${tssState}`)

        // State machine for TSS setup:
        // CREATED -> (set admin PIN) -> UNINITIALIZED -> (initialize) -> INITIALIZED

        if (tssState === 'CREATED') {
            logs.push('   TSS is CREATED, transitioning to UNINITIALIZED...')

            try {
                // Transition from CREATED to UNINITIALIZED
                await axios.patch(
                    `${baseUrl}/tss/${tseConfig.tss_id}`,
                    {
                        state: 'UNINITIALIZED',
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
                logs.push('✅ TSS now UNINITIALIZED')
                tssState = 'UNINITIALIZED'
            } catch (stateError) {
                logs.push('❌ Failed to transition TSS state')
                if (
                    typeof stateError === 'object' &&
                    stateError !== null &&
                    'response' in stateError
                ) {
                    const err = stateError as { response?: { status?: number; data?: unknown } }
                    logs.push(`   Status: ${err.response?.status}`)
                    logs.push(`   Error: ${JSON.stringify(err.response?.data, null, 2)}`)
                }
                return { success: false, logs }
            }
        }

        if (tssState === 'UNINITIALIZED') {
            logs.push('   TSS is UNINITIALIZED, initializing...')

            // Admin PIN is required for initialization
            const adminPin = tseConfig.admin_pin
            if (!adminPin) {
                logs.push('❌ Admin PIN not configured!')
                logs.push('   Please add your Admin PIN from the Fiskaly Dashboard in Settings.')
                return { success: false, logs }
            }

            // Step 3a: Authenticate as Admin first
            logs.push('   Authenticating as Admin...')
            try {
                await axios.post(
                    `${baseUrl}/tss/${tseConfig.tss_id}/admin/auth`,
                    { admin_pin: adminPin },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
                logs.push('✅ Admin authentication successful')
            } catch (adminAuthError) {
                logs.push('❌ Admin authentication failed')
                if (
                    typeof adminAuthError === 'object' &&
                    adminAuthError !== null &&
                    'response' in adminAuthError
                ) {
                    const err = adminAuthError as { response?: { status?: number; data?: unknown } }
                    logs.push(`   Status: ${err.response?.status}`)
                    logs.push(`   Error: ${JSON.stringify(err.response?.data, null, 2)}`)
                }
                return { success: false, logs }
            }

            // Step 3b: Now initialize TSS
            logs.push('   Initializing TSS...')
            try {
                await axios.patch(
                    `${baseUrl}/tss/${tseConfig.tss_id}`,
                    { state: 'INITIALIZED' },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
                tssState = 'INITIALIZING'
                logs.push('   Initialization started...')
            } catch (initError) {
                logs.push('❌ Failed to start initialization')
                if (
                    typeof initError === 'object' &&
                    initError !== null &&
                    'response' in initError
                ) {
                    const err = initError as { response?: { status?: number; data?: unknown } }
                    logs.push(`   Status: ${err.response?.status}`)
                    logs.push(`   Error: ${JSON.stringify(err.response?.data, null, 2)}`)
                }
                return { success: false, logs }
            }
        }

        // Wait for INITIALIZING to complete
        if (tssState === 'INITIALIZING') {
            logs.push('   Waiting for initialization to complete...')

            let attempts = 0
            const maxAttempts = 30

            while (tssState === 'INITIALIZING' && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000))
                attempts++

                const statusResponse = await axios.get(`${baseUrl}/tss/${tseConfig.tss_id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                })

                tssState = statusResponse.data.state
                logs.push(`   Attempt ${attempts}: State = ${tssState}`)

                if (tssState === 'INITIALIZED') {
                    break
                }
            }

            if (tssState !== 'INITIALIZED') {
                logs.push(`❌ TSS initialization timeout (still in state: ${tssState})`)
                return { success: false, logs }
            }
        }

        if (tssState === 'INITIALIZED') {
            logs.push('✅ TSS is INITIALIZED')
        } else {
            logs.push(`⚠️  TSS in unexpected state: ${tssState}`)
            return { success: false, logs }
        }

        // Step 4: Register Client
        logs.push('')
        logs.push('=== Step 4: Register Client ===')

        try {
            await axios.put(
                `${baseUrl}/tss/${tseConfig.tss_id}/client/${tseConfig.client_id}`,
                {
                    serial_number: tseConfig.client_id,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            )

            logs.push('✅ Client registered/verified')
        } catch (clientError) {
            logs.push('❌ Client registration error')
            if (
                typeof clientError === 'object' &&
                clientError !== null &&
                'response' in clientError
            ) {
                const err = clientError as { response?: { status?: number; data?: unknown } }
                logs.push(`   Status: ${err.response?.status}`)
                logs.push(`   Error: ${JSON.stringify(err.response?.data, null, 2)}`)
            }
            return { success: false, logs }
        }

        // Step 5: Start Transaction
        logs.push('')
        logs.push('=== Step 5: Start Transaction ===')

        // Generate a proper UUID for the transaction
        const testTxId = crypto.randomUUID()
        logs.push(`   Transaction ID: ${testTxId}`)

        try {
            const startTxResponse = await axios.put(
                `${baseUrl}/tss/${tseConfig.tss_id}/tx/${testTxId}?tx_revision=1`,
                {
                    state: 'ACTIVE',
                    client_id: tseConfig.client_id,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            )

            logs.push('✅ Transaction started')
            logs.push(`   Number: ${startTxResponse.data.number}`)

            // Step 6: Finish transaction
            logs.push('')
            logs.push('=== Step 6: Finish Transaction ===')

            const finishTxResponse = await axios.put(
                `${baseUrl}/tss/${tseConfig.tss_id}/tx/${testTxId}?tx_revision=2`,
                {
                    state: 'FINISHED',
                    client_id: tseConfig.client_id,
                    schema: {
                        standard_v1: {
                            receipt: {
                                receipt_type: 'RECEIPT',
                                amounts_per_vat_rate: [
                                    {
                                        vat_rate: '19',
                                        amount: '10.00',
                                    },
                                ],
                                amounts_per_payment_type: [
                                    {
                                        payment_type: 'CASH',
                                        amount: '10.00',
                                    },
                                ],
                            },
                        },
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            )

            logs.push('✅ Transaction finished successfully!')
            logs.push(`   Transaction Number: ${finishTxResponse.data.number}`)
            logs.push(`   Signature: ${finishTxResponse.data.signature.value.substring(0, 30)}...`)

            return { success: true, logs }
        } catch (txError) {
            logs.push('❌ Transaction error')
            if (typeof txError === 'object' && txError !== null && 'response' in txError) {
                const err = txError as { response?: { status?: number; data?: unknown } }
                logs.push(`   Status: ${err.response?.status}`)
                logs.push(`   Error: ${JSON.stringify(err.response?.data, null, 2)}`)
            }
            return { success: false, logs }
        }
    } catch (error) {
        logs.push('❌ Fatal error')
        if (typeof error === 'object' && error !== null && 'response' in error) {
            const err = error as { response?: { status?: number; data?: unknown } }
            logs.push(`   Status: ${err.response?.status}`)
            logs.push(`   Error: ${JSON.stringify(err.response?.data, null, 2)}`)
        } else {
            logs.push(`   ${error instanceof Error ? error.message : String(error)}`)
        }
        return { success: false, logs, error }
    }
}
