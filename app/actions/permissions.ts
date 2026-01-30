'use server'

import { createClient } from '@/utils/supabase/server'
import { getOrganizationId } from '@/lib/get-organization'

export async function updatePermission(
    role: string,
    permissionKey: string,
    accessLevel: 'true' | 'false' | 'own'
) {
    const supabase = await createClient()

    // Check authorization (only admin)
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Verify admin role
    const organizationId = await getOrganizationId()

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .eq('organization_id', organizationId)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Forbidden: Only admins can manage permissions' }
    }

    // Update permission
    const { error } = await supabase.from('role_permissions').upsert(
        {
            role,
            permission_key: permissionKey,
            access_level: accessLevel,
            updated_at: new Date().toISOString(),
            organization_id: organizationId,
        },
        { onConflict: 'role, permission_key, organization_id' }
    )

    if (error) {
        console.error('Error updating permission:', error)
        return { error: 'Failed to update permission' }
    }

    return { success: true }
}
