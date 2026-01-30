import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz' // From .env.local

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkProfiles() {
    console.log('--- DEBUG PROFILES START ---')
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Total profiles:', profiles.length)
    profiles.forEach(p => {
        console.log(`- ${p.first_name} ${p.last_name} (${p.role})`)
    })

    const staff = profiles.filter(p => ['admin', 'manager', 'staff'].includes(p.role as string))
    console.log('Filtered Staff Count (JS):', staff.length)
    console.log('--- DEBUG PROFILES END ---')
}

checkProfiles()
