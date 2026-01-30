import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { TseManager } from '../lib/tse/tse-manager'

// Simple .env parser (reused)
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local')
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8')
            envConfig.split('\n').forEach(line => {
                const [key, value] = line.split('=')
                if (key && value && !process.env[key.trim()]) {
                    process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '')
                }
            })
        }
    } catch (e) {
        console.error('Error loading .env.local', e)
    }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifySigning() {
    console.log('--- Testing TSE Signing ---')

    // We instantiate TseManager directly (not via getTseManager which uses caching/defaults)
    const manager = new TseManager()

    // Inject our direct client
    const success = await manager.initialize(DEMO_ORG_ID, supabase)

    if (!success) {
        console.error('❌ Failed to initialize TSE Manager')
        // Check config to see if it's the dummy one
        const { data: config } = await supabase
            .from('tse_configurations')
            .select('*')
            .eq('organization_id', DEMO_ORG_ID)
            .single()
        if (config?.api_key === 'test_api_key') {
            console.log(
                '⚠️  This is expected if using dummy credentials (test_api_key). The Manager fails health check.'
            )
            console.log(
                '   To fix this, update .env.local with valid FISKALY_API_KEY/SECRET or update the DB directly with valid credentials.'
            )
        }
        return
    }

    console.log('✅ TSE Manager Initialized!')

    // Try to sign
    const result = await manager.signTransaction(`test-${Date.now()}`, 15.5, 'cash', [
        { name: 'Test Item', price: 15.5, quantity: 1 },
    ])

    if (result) {
        console.log('✅ Transaction Signed Successfully!')
        console.table(result)
    } else {
        console.error('❌ Signing failed')
    }
}

verifySigning().catch(console.error)
