'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getOrganizationId } from '@/lib/get-organization'

// Action to claim an open shift
export async function claimShift(shiftId: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Nicht angemeldet' }
    }

    const organizationId = await getOrganizationId()

    // Check if the shift is actually open and published
    // We use a transaction-like check by adding conditions to the update
    const { data: updatedShift, error } = await supabase
        .from('shifts')
        .update({ staff_id: user.id })
        .eq('id', shiftId)
        .is('staff_id', null) // Must be currently unassigned
        .eq('status', 'published') // Must be published
        .eq('organization_id', organizationId)
        .select()
        .single()

    if (error || !updatedShift) {
        return {
            error: 'Schicht konnte nicht übernommen werden. Vielleicht ist sie nicht mehr verfügbar.',
        }
    }

    revalidatePath('/staff/shifts')
    revalidatePath('/admin/shifts')
    return { success: true, message: 'Schicht erfolgreich übernommen!' }
}

// Action to release a shift (cancel participation)
// Only allowed if the shift is in the future
export async function releaseShift(shiftId: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Nicht angemeldet' }
    }

    const organizationId = await getOrganizationId()

    // Check if it's the user's shift and in the future
    const { data: shift, error: fetchError } = await supabase
        .from('shifts')
        .select('start_time, staff_id')
        .eq('id', shiftId)
        .eq('organization_id', organizationId)
        .single()

    if (fetchError || !shift) return { error: 'Schicht nicht gefunden' }

    if (shift.staff_id !== user.id) return { error: 'Das ist nicht deine Schicht' }

    if (new Date(shift.start_time) < new Date()) {
        return { error: 'Vergangene Schichten können nicht abgegeben werden.' }
    }

    // Release it
    const { error } = await supabase
        .from('shifts')
        .update({ staff_id: null })
        .eq('id', shiftId)
        .eq('organization_id', organizationId)

    if (error) return { error: 'Fehler beim Abgeben der Schicht.' }

    revalidatePath('/staff/shifts')
    revalidatePath('/admin/shifts')
    return { success: true, message: 'Schicht abgegeben. Sie ist wieder verfügbar.' }
}
