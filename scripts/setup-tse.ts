import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Simple .env parser
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

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001'

// Test credentials for Fiskaly (Sandbox)
const FISKALY_TEST_CONFIG = {
    api_key: 'test_8wtvat1yuhmo5w32xkb9b51vf_chalk',
    api_secret: 'q8Hb20dGno6QXxI0aiR5bxdQ3jcXQo8nv6uVvvUZozy',
    tss_id: '71a189fb-4117-423b-9d90-86890c59505f',
    client_id: 'd9b2d63d-a233-4123-8478-f5f6e8e78988',
    environment: 'sandbox',
    is_active: true,
    admin_pin: 'romqy8-saffub-kygKyg',
}

async function setupTSE() {
    console.log('--- Verifying TSE Configuration ---')

    // Check if configuration exists
    const { data: existingConfig, error: fetchError } = await supabase
        .from('tse_configurations')
        .select('*')
        .eq('organization_id', DEMO_ORG_ID)
        .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found"
        console.error('Error fetching config:', fetchError)
        return
    }

    if (existingConfig) {
        console.log('⚠️ TSE Configuration already exists. Updating with provided credentials...')
        const { error: updateError } = await supabase
            .from('tse_configurations')
            .update(FISKALY_TEST_CONFIG)
            .eq('organization_id', DEMO_ORG_ID)

        if (updateError) {
            console.error('❌ Failed to update TSE config:', updateError)
        } else {
            console.log('✅ TSE Configuration updated successfully!')
        }
        return
    }

    console.log('⚠️ No TSE Configuration found. Seeding default test config...')

    // In a real scenario, we might want to actually CREATE a TSS via API here if we had the keys,
    // but for now let's insert the placeholder data so the app doesn't crash.
    // NOTE: Without valid Fiskaly credentials, the `TseManager` health check will fail,
    // but at least the database state will be correct.

    const { data: newConfig, error: insertError } = await supabase
        .from('tse_configurations')
        .insert({
            organization_id: DEMO_ORG_ID,
            ...FISKALY_TEST_CONFIG,
        })
        .select()
        .single()

    if (insertError) {
        console.error('❌ Failed to seed TSE config:', insertError)
    } else {
        console.log('✅ TSE Configuration seeded successfully!')
        console.log(newConfig)
    }
}

setupTSE().catch(console.error)
