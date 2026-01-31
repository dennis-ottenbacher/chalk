#!/usr/bin/env npx tsx
/**
 * Seed Test Users Script
 *
 * Creates test users via Supabase Auth Admin API for local development.
 * Run after `npx supabase db reset` to create proper auth users.
 *
 * Usage: npx tsx scripts/seed-users.ts
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load .env.local
config({ path: '.env.local' })

// Get keys from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables. Make sure .env.local exists with:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL')
    console.error('   SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
})

interface TestUser {
    email: string
    password: string
    firstName: string
    lastName: string
    role: 'admin' | 'manager' | 'staff' | 'member' | 'athlete'
    memberId: string
}

const TEST_USERS: TestUser[] = [
    // Admins
    {
        email: 'admin@chalk.app',
        password: 'admin123',
        firstName: 'Dennis',
        lastName: 'Ottenbacher',
        role: 'admin',
        memberId: 'ADM-001',
    },
    {
        email: 'sarah@chalk.app',
        password: 'admin123',
        firstName: 'Sarah',
        lastName: 'Admin',
        role: 'admin',
        memberId: 'ADM-002',
    },

    // Manager
    {
        email: 'manager@chalk.app',
        password: 'manager123',
        firstName: 'Michael',
        lastName: 'Manager',
        role: 'manager',
        memberId: 'MGR-001',
    },

    // Staff
    {
        email: 'staff1@chalk.app',
        password: 'staff123',
        firstName: 'Anna',
        lastName: 'Trainer',
        role: 'staff',
        memberId: 'STF-001',
    },
    {
        email: 'staff2@chalk.app',
        password: 'staff123',
        firstName: 'Tom',
        lastName: 'Routenbauer',
        role: 'staff',
        memberId: 'STF-002',
    },
    {
        email: 'staff3@chalk.app',
        password: 'staff123',
        firstName: 'Julia',
        lastName: 'Theke',
        role: 'staff',
        memberId: 'STF-003',
    },

    // Members
    {
        email: 'max@example.com',
        password: 'member123',
        firstName: 'Max',
        lastName: 'Mustermann',
        role: 'member',
        memberId: 'MEM-001',
    },
    {
        email: 'lisa@example.com',
        password: 'member123',
        firstName: 'Lisa',
        lastName: 'Lustig',
        role: 'member',
        memberId: 'MEM-002',
    },
    {
        email: 'peter@example.com',
        password: 'member123',
        firstName: 'Peter',
        lastName: 'Parker',
        role: 'member',
        memberId: 'MEM-003',
    },
    {
        email: 'marie@example.com',
        password: 'member123',
        firstName: 'Marie',
        lastName: 'Curie',
        role: 'member',
        memberId: 'MEM-004',
    },
    {
        email: 'hans@example.com',
        password: 'member123',
        firstName: 'Hans',
        lastName: 'Müller',
        role: 'member',
        memberId: 'MEM-005',
    },

    // Athletes
    {
        email: 'athlete1@example.com',
        password: 'athlete123',
        firstName: 'Adam',
        lastName: 'Ondra',
        role: 'athlete',
        memberId: 'ATH-001',
    },
    {
        email: 'athlete2@example.com',
        password: 'athlete123',
        firstName: 'Janja',
        lastName: 'Garnbret',
        role: 'athlete',
        memberId: 'ATH-002',
    },
]

async function createUser(user: TestUser) {
    try {
        // 1. Check if user exists (by email) to avoid errors
        const { data: listData } = await supabase.auth.admin.listUsers()
        const existingUser = listData.users.find(u => u.email === user.email)

        let userId = existingUser?.id

        if (existingUser) {
            console.log(`  ℹ️  User ${user.email} already exists.`)
        } else {
            // 2. Create user if not exists
            const { data, error } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true,
                user_metadata: {
                    first_name: user.firstName,
                    last_name: user.lastName,
                },
            })

            if (error) {
                console.error(`  ❌ Error creating ${user.email}: ${error.message}`)
                return
            }
            userId = data.user?.id
            console.log(`  ✅ Created user ${user.email}`)
        }

        if (!userId) return

        // 3. Update profile (Role & Member ID)
        // We wait a bit to ensure trigger has run, or we use UPSERT to be safe
        await new Promise(r => setTimeout(r, 500))

        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                role: user.role,
                member_id: user.memberId,
                first_name: user.firstName,
                last_name: user.lastName,
            })
            .eq('id', userId)

        if (profileError) {
            console.error(`  ⚠️  Error updating profile for ${user.email}: ${profileError.message}`)

            // Fallback: If profile doesn't exist yet (trigger failed?), insert it manually
            const { error: insertError } = await supabase.from('profiles').insert({
                id: userId,
                role: user.role,
                member_id: user.memberId,
                first_name: user.firstName,
                last_name: user.lastName,
                // Default Organization ID (Demo)
                organization_id: '00000000-0000-0000-0000-000000000001',
            })

            if (insertError) {
                console.error(`  ❌ Failed to insert profile fallback: ${insertError.message}`)
            } else {
                console.log(`  ✅ Created profile manually for ${user.email}`)
            }
        } else {
            console.log(`  ✨ Profile updated for ${user.email} (${user.role})`)
        }
    } catch (err) {
        console.error(`  ❌ Unexpected error for ${user.email}:`, err)
    }
}

async function main() {
    console.log('🌱 Seeding Test Users via Supabase Auth API...\n')

    for (const user of TEST_USERS) {
        await createUser(user)
    }

    console.log('\n✅ User seeding completed.')
}

main().catch(console.error)
