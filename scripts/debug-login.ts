import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Simple .env parser since we can't rely on dotenv
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local')
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8')
            envConfig.split('\n').forEach(line => {
                const [key, value] = line.split('=')
                if (key && value && !process.env[key.trim()]) {
                    process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '') // remove quotes
                }
            })
        }
    } catch (e) {
        console.error('Error loading .env.local', e)
    }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local')
    console.error('URL:', supabaseUrl ? 'Found' : 'Missing')
    console.error('Key:', supabaseServiceRoleKey ? 'Found' : 'Missing')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
})

async function main() {
    console.log('--- Inspecting Organizations ---')
    const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .or('slug.eq.demo,id.eq.00000000-0000-0000-0000-000000000001')

    if (orgError) console.error('Error fetching organizations:', orgError)
    else console.table(orgs)

    console.log('\n--- Inspecting Users (auth.users) ---')
    const {
        data: { users },
        error: usersError,
    } = await supabase.auth.admin.listUsers()

    if (usersError) {
        console.error('Error fetching users:', usersError)
    } else {
        console.log(`Found ${users.length} users.`)

        console.log('\n--- Inspecting Profiles (public.profiles) ---')
        // Fetch profiles for these users
        const userIds = users.map(u => u.id)
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds)

        if (profilesError) console.error('Error fetching profiles:', profilesError)
        else {
            const combinedData = users.map(user => {
                const profile = profiles?.find(p => p.id === user.id)
                return {
                    email: user.email,
                    id: user.id,
                    role: profile?.role,
                    org_id: profile?.organization_id,
                    full_name: profile?.full_name,
                }
            })
            console.table(combinedData)
        }
    }
}

main().catch(console.error)
