import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
})

async function createAdminUser() {
    // Delete existing user if exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existing = existingUsers?.users.find(u => u.email === 'admin@chalk.app')

    if (existing) {
        console.log('Deleting existing user...')
        await supabase.auth.admin.deleteUser(existing.id)
    }

    // Create new user
    console.log('Creating admin user...')
    const { data, error } = await supabase.auth.admin.createUser({
        email: 'admin@chalk.app',
        password: 'password123',
        email_confirm: true,
        user_metadata: {
            first_name: 'Admin',
            last_name: 'User',
        },
    })

    if (error) {
        console.error('Error creating user:', error)
        process.exit(1)
    }

    console.log('User created successfully:', data.user.id)

    // Create profile
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        organization_id: '00000000-0000-0000-0000-000000000001',
    })

    if (profileError) {
        console.error('Error creating profile:', profileError)
        process.exit(1)
    }

    console.log('Profile created successfully')
    console.log('\nLogin credentials:')
    console.log('Email: admin@chalk.app')
    console.log('Password: password123')
}

createAdminUser()
