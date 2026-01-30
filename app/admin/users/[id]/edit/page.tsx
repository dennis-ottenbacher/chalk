import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { EditUserForm } from './edit-user-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: user, error } = await supabase.from('profiles').select('*').eq('id', id).single()

    if (error || !user) {
        notFound()
    }

    const { data: rawRoles } = await supabase.from('staff_roles').select('role').eq('user_id', id)

    const userRoles = rawRoles ? rawRoles.map(r => r.role) : []

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/users">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Benutzer bearbeiten</h1>
            </div>

            <EditUserForm user={user} userRoles={userRoles} />
        </div>
    )
}
