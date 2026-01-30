import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = createAdminClient()

    // Check if admin exists
    const {
        data: { users },
    } = await supabase.auth.admin.listUsers()
    const existing = users.find(u => u.email === 'admin@chalk.gym')

    if (existing) {
        return NextResponse.json({ message: 'Admin already exists' })
    }

    const { data, error } = await supabase.auth.admin.createUser({
        email: 'admin@chalk.gym',
        password: 'password123',
        email_confirm: true,
    })

    if (error) return NextResponse.json({ error }, { status: 500 })

    if (data.user) {
        // Create profile
        const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            first_name: 'System',
            last_name: 'Admin',
            role: 'admin',
        })
        if (profileError) return NextResponse.json({ error: profileError }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: data.user })
}
