// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Manual env loading since vitest might not load .env.local automatically in this setup
const envPath = path.resolve(process.cwd(), '.env.local')
const envFile = fs.readFileSync(envPath, 'utf8')
const envVars = envFile.split('\n').reduce(
    (acc, line) => {
        const [key, value] = line.split('=')
        if (key && value) {
            acc[key.trim()] = value.trim()
        }
        return acc
    },
    {} as Record<string, string>
)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || envVars['NEXT_PUBLIC_SUPABASE_URL']
const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || envVars['SUPABASE_SERVICE_ROLE_KEY']
const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']

describe('Products RLS', () => {
    let adminUser: { id: string; email: string }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

    beforeAll(async () => {
        // Create Admin User
        const email = `test_admin_${Date.now()}@example.com`
        const password = 'password123'

        const {
            data: { user },
            error,
        } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        })

        if (error || !user) throw new Error(`Failed to create user: ${error?.message}`)
        adminUser = { id: user.id, email }

        // Promote to admin
        await supabaseAdmin.from('profiles').update({ role: 'admin' }).eq('id', user.id)

        // Sign in
        const { error: signInError } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        })
        if (signInError) throw new Error(`Failed to sign in: ${signInError.message}`)
    })

    afterAll(async () => {
        if (adminUser) {
            await supabaseAdmin.auth.admin.deleteUser(adminUser.id)
        }
    })

    it('should allow admin to create a product', async () => {
        const { data, error } = await supabaseClient
            .from('products')
            .insert({
                name: 'Test Product',
                description: 'Integration Test Product',
                price: 10.0,
                type: 'goods',
            })
            .select()
            .single()

        // Currently we EXPECT this to fail until we fix it.
        // The user asked to "Check" (verify it fails) so I will write the assertion expecting success
        // knowing it will fail, thus confirming the bug.
        // OR better: I will log the error if present and fail the test.
        if (error) {
            console.error('RLS Error:', error)
        }
        expect(error).toBeNull()
        expect(data).toHaveProperty('id')
    })
})
