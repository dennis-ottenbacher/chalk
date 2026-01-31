import { createClient } from '@/utils/supabase/server'
import { PermissionMatrix } from '@/components/admin/permissions/permission-matrix'

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic'

export default async function AdminPermissionsPage() {
    const supabase = await createClient()

    // Fetch existing permissions
    const { data: permissions } = await supabase.from('role_permissions').select('*')

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Access Control & Roles</h1>
            </div>

            <PermissionMatrix initialPermissions={permissions || []} />
        </div>
    )
}
