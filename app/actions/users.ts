'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getOrganizationId } from '@/lib/get-organization'

// Schema validation for creating a user
const CreateUserSchema = z.object({
    first_name: z.string().min(1, 'Vorname ist erforderlich'),
    last_name: z.string().min(1, 'Nachname ist erforderlich'),
    email: z.string().email('Ungültige E-Mail-Adresse'),
    role: z.enum(['admin', 'staff', 'manager']),
    password: z
        .string()
        .min(6, 'Passwort muss mindestens 6 Zeichen lang sein')
        .optional()
        .or(z.literal('')),
    // Address fields
    address: z.string().optional(),
    city: z.string().optional(),
    zip_code: z.string().optional(),
})

export type CreateUserFormState = {
    error?: string
    success?: boolean
    message?: string
}

// Check if current user is authorized (Admin or Manager)
async function checkAuth() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const organizationId = await getOrganizationId()

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .eq('organization_id', organizationId)
        .single()

    // Only allow admins and managers to create users
    if (!profile || !['admin', 'manager'].includes(profile.role)) {
        return null
    }
    return user
}

export async function createUser(
    prevState: CreateUserFormState,
    formData: FormData
): Promise<CreateUserFormState> {
    // 1. Authorization Check
    const authorizedUser = await checkAuth()
    if (!authorizedUser) {
        return { error: 'Nicht autorisiert. Nur Admins und Manager können Benutzer anlegen.' }
    }

    // 2. Parse and Validate Input
    const rawData = {
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        email: formData.get('email'),
        role: formData.get('role'),
        password: formData.get('password'),
        address: formData.get('address'),
        city: formData.get('city'),
        zip_code: formData.get('zip_code'),
    }

    const validatedFields = CreateUserSchema.safeParse(rawData)

    if (!validatedFields.success) {
        const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
        return { error: firstError || 'Validierung fehlgeschlagen' }
    }

    const { email, first_name, last_name, role, password, address, city, zip_code } =
        validatedFields.data

    // 3. Create User in Supabase Auth (using Service Role)
    const adminSupabase = createAdminClient()
    const organizationId = await getOrganizationId()

    // Use provided password or generate a temporary one
    const finalPassword = password && password.length >= 6 ? password : 'TempPassword123!'

    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
        email,
        password: finalPassword,
        email_confirm: true, // Confirm immediately so they can login
        user_metadata: {
            first_name,
            last_name,
        },
    })

    if (authError) {
        return { error: `Fehler beim Erstellen des Benutzers: ${authError.message}` }
    }

    if (!authData.user) {
        return { error: 'Benutzer konnte nicht erstellt werden' }
    }

    // 4. Create Profile in 'profiles' table
    const { error: profileError } = await adminSupabase.from('profiles').insert({
        id: authData.user.id,
        first_name,
        last_name,
        email,
        role: role as 'admin' | 'manager' | 'staff',
        address: address || null,
        city: city || null,
        zip_code: zip_code || null,
        organization_id: organizationId,
    })

    if (profileError) {
        // Rollback: Delete the auth user if profile creation fails
        await adminSupabase.auth.admin.deleteUser(authData.user.id)
        return { error: `Fehler beim Erstellen des Profils: ${profileError.message}` }
    }

    // 5. Revalidate cache
    revalidatePath('/admin/users') // Assuming a user management list exists here, can be adjusted

    return {
        success: true,
        message: `Benutzer ${first_name} ${last_name} (${role}) wurde erfolgreich erstellt.`,
    }
}

// Schema validation for updating a user
const UpdateUserSchema = z.object({
    id: z.string().uuid(),
    first_name: z.string().min(1, 'Vorname ist erforderlich'),
    last_name: z.string().min(1, 'Nachname ist erforderlich'),
    email: z.string().email('Ungültige E-Mail-Adresse'),
    role: z.enum(['admin', 'staff', 'manager', 'member', 'athlete']),
    // Address fields
    address: z.string().optional(),
    city: z.string().optional(),
    zip_code: z.string().optional(),
    birth_date: z.string().optional(),
    member_id: z.string().optional(),
})

export async function updateUser(
    prevState: CreateUserFormState,
    formData: FormData
): Promise<CreateUserFormState> {
    // 1. Authorization Check
    const authorizedUser = await checkAuth()
    if (!authorizedUser) {
        return { error: 'Nicht autorisiert. Nur Admins und Manager können Benutzer bearbeiten.' }
    }

    // 2. Parse and Validate Input
    const rawData = {
        id: formData.get('id'),
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        email: formData.get('email'),
        role: formData.get('role'),
        address: formData.get('address'),
        city: formData.get('city'),
        zip_code: formData.get('zip_code'),
        birth_date: formData.get('birth_date'),
        member_id: formData.get('member_id'),
    }

    const validatedFields = UpdateUserSchema.safeParse(rawData)

    if (!validatedFields.success) {
        const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
        return { error: firstError || 'Validierung fehlgeschlagen' }
    }

    const {
        id,
        email,
        first_name,
        last_name,
        role,
        address,
        city,
        zip_code,
        birth_date,
        member_id,
    } = validatedFields.data

    // 3. Update User in Supabase Auth (using Service Role)
    const adminSupabase = createAdminClient()
    const organizationId = await getOrganizationId()

    // Update email and metadata in Auth
    const { error: authError } = await adminSupabase.auth.admin.updateUserById(id, {
        email,
        user_metadata: {
            first_name,
            last_name,
        },
        // We do not update password here to keep it simple, or we could add it as optional
    })

    if (authError) {
        return { error: `Fehler beim Aktualisieren des Benutzers: ${authError.message}` }
    }

    // 4. Update Profile in 'profiles' table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
        first_name,
        last_name,
        email,
        role,
        address: address || null,
        city: city || null,
        zip_code: zip_code || null,
        birth_date: birth_date || null,
        member_id: member_id || null,
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key])

    const { error: profileError } = await adminSupabase
        .from('profiles')
        .update(updateData)
        .eq('id', id)
        .eq('organization_id', organizationId)

    if (profileError) {
        return { error: `Fehler beim Aktualisieren des Profils: ${profileError.message}` }
    }

    // 5. Update Staff Roles (Qualifications)
    // We do this after profile update to ensure user exists and basic info is correct.
    // Using adminSupabase to bypass RLS if needed, though manager should have access via RLS.

    // Get roles from formData. getAll returns all values for keys with name 'roles'.
    const roles = formData.getAll('roles') as string[]

    // Delete existing roles for this user
    const { error: deleteRolesError } = await adminSupabase
        .from('staff_roles')
        .delete()
        .eq('user_id', id)

    if (deleteRolesError) {
        console.error('Error deleting staff roles:', deleteRolesError)
        // We don't fail the whole request here, but we should probably log it.
        // Or return error? For now, let's log and proceed as profile is updated.
    } else if (roles.length > 0) {
        // Insert new roles
        const rolesToInsert = roles.map(r => ({
            user_id: id,
            role: r,
        }))

        const { error: insertRolesError } = await adminSupabase
            .from('staff_roles')
            .insert(rolesToInsert)

        if (insertRolesError) {
            console.error('Error inserting staff roles:', insertRolesError)
            return {
                error: `Benutzerprofil aktualisiert, aber Rollen konnten nicht gespeichert werden: ${insertRolesError.message}`,
            }
        }
    }

    // 6. Revalidate cache
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${id}`)
    revalidatePath('/admin/members')
    revalidatePath(`/admin/members/${id}`)

    return {
        success: true,
        message: `Benutzer ${first_name} ${last_name} wurde erfolgreich aktualisiert.`,
    }
}
