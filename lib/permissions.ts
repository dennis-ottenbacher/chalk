import { createClient } from '@/utils/supabase/server'
import { getOrganizationId } from '@/lib/get-organization'

export async function hasPermission(
    userId: string,
    permissionKey: string,
    organizationId?: string
): Promise<boolean> {
    const supabase = await createClient()
    const orgId = organizationId || (await getOrganizationId())

    // 1. Get User Role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .eq('organization_id', orgId)
        .single()

    if (!profile?.role) return false

    // 2. Check Permission
    // We try to find the permission for this role and organization
    const { data: permission } = await supabase
        .from('role_permissions')
        .select('access_level')
        .eq('role', profile.role)
        .eq('permission_key', permissionKey)
        .eq('organization_id', orgId)
        .single()

    if (permission) {
        return permission.access_level === 'true'
    }

    // Fallback: If not found for specific org, check for default org (template)
    // defined as '00000000-0000-0000-0000-000000000001'
    const DEFAULT_ORG = '00000000-0000-0000-0000-000000000001'
    if (orgId !== DEFAULT_ORG) {
        const { data: defaultPermission } = await supabase
            .from('role_permissions')
            .select('access_level')
            .eq('role', profile.role)
            .eq('permission_key', permissionKey)
            .eq('organization_id', DEFAULT_ORG)
            .single()

        if (defaultPermission) {
            return defaultPermission.access_level === 'true'
        }
    }

    return false
}
