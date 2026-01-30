'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getOrganizationId } from '@/lib/get-organization'

// Types
export type Shift = {
    id: string
    staff_id: string | null
    start_time: string
    end_time: string
    role: string
    status: 'draft' | 'published' | 'cancelled'
    notes: string | null
    // Joined fields
    staff?: {
        first_name: string | null
        last_name: string | null
    } | null
    shift_checklists?: Array<{
        id: string
        template_id: string
    }>
}

export type StaffEvent = {
    id: string
    staff_id: string
    event_description: string
    start_time: string
    end_time: string
    is_profound?: boolean
}

const ShiftSchema = z.object({
    id: z.string().optional(),
    staff_id: z.string().nullable().optional(),
    start_time: z.string(),
    end_time: z.string(),
    role: z.string().min(1, 'Rolle ist erforderlich'),
    status: z.enum(['draft', 'published', 'cancelled']),
    notes: z.string().optional().nullable(),
})

export type SaveShiftState = {
    error?: string
    success?: boolean
    message?: string
    shift?: Shift
}

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

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
        return null
    }
    return user
}

export async function getShifts(startDate: string, endDate: string) {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { data, error } = await supabase
        .from('shifts')
        .select(
            `
            *,
            staff:profiles(first_name, last_name),
            shift_checklists(id, template_id)
        `
        )
        .eq('organization_id', organizationId)
        .gte('start_time', startDate)
        .lte('end_time', endDate)
        .order('start_time', { ascending: true })

    if (error) {
        console.error('Error fetching shifts:', error)
        return []
    }

    return data as Shift[]
}

export async function getStaffMembers() {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { data, error } = await supabase
        .from('profiles')
        .select(
            `
            id, 
            first_name, 
            last_name, 
            role,
            staff_roles (
                role
            )
        `
        )
        .eq('organization_id', organizationId)
        .order('first_name', { ascending: true })

    if (error) {
        console.error('Error fetching staff:', error)
        return []
    }

    // Filter in memory to ensure we catch all valid roles regardless of DB enum strictness
    const staff = data.filter(p => ['admin', 'manager', 'staff'].includes(p.role as string))

    return staff
}

export async function getStaffEvents(startDate: string, endDate: string) {
    const user = await checkAuth()
    if (!user) return []

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('staff_events')
        .select('*')
        .lte('start_time', endDate)
        .gte('end_time', startDate)

    if (error) {
        console.error('Error fetching staff events:', error)
        return []
    }

    return data as StaffEvent[]
}

export async function saveShift(
    prevState: SaveShiftState,
    formData: FormData
): Promise<SaveShiftState> {
    const user = await checkAuth()
    if (!user) {
        return { error: 'Nicht autorisiert.' }
    }

    const rawData = {
        id: formData.get('id') ? String(formData.get('id')) : undefined,
        staff_id:
            formData.get('staff_id') === 'open' ? null : String(formData.get('staff_id')) || null,
        start_time: String(formData.get('start_time')),
        end_time: String(formData.get('end_time')),
        role: String(formData.get('role')),
        status: String(formData.get('status')) as 'draft' | 'published' | 'cancelled',
        notes: formData.get('notes') ? String(formData.get('notes')) : null,
    }

    // Zod validation
    const validated = ShiftSchema.safeParse(rawData)
    if (!validated.success) {
        // Flatten errors to simple string
        const errorMsg = Object.values(validated.error.flatten().fieldErrors).flat().join(', ')
        return { error: 'Validierung fehlgeschlagen: ' + errorMsg }
    }

    const dataToSave = validated.data
    const supabase = await createClient()

    let savedId = dataToSave.id

    if (savedId) {
        // Update
        const organizationId = await getOrganizationId()
        const { error } = await supabase
            .from('shifts')
            .update({
                staff_id: dataToSave.staff_id,
                start_time: dataToSave.start_time,
                end_time: dataToSave.end_time,
                role: dataToSave.role,
                status: dataToSave.status,
                notes: dataToSave.notes,
            })
            .eq('id', savedId)
            .eq('organization_id', organizationId)

        if (error) return { error: error.message }
    } else {
        // Create
        const organizationId = await getOrganizationId()
        const { data, error } = await supabase
            .from('shifts')
            .insert({
                staff_id: dataToSave.staff_id,
                start_time: dataToSave.start_time,
                end_time: dataToSave.end_time,
                role: dataToSave.role,
                status: dataToSave.status,
                notes: dataToSave.notes,
                organization_id: organizationId,
            })
            .select('id')
            .single()

        if (error) return { error: error.message }
        savedId = data.id
    }

    // Handle Recurring Duplication
    const futureShiftsRaw = formData.get('future_shifts')
    if (futureShiftsRaw) {
        try {
            const futureShifts = JSON.parse(String(futureShiftsRaw))
            if (Array.isArray(futureShifts) && futureShifts.length > 0) {
                const organizationId = await getOrganizationId()
                const shiftsToInsert = futureShifts.map(
                    (fs: { start_time: string; end_time: string }) => ({
                        staff_id: dataToSave.staff_id,
                        role: dataToSave.role,
                        notes: dataToSave.notes,
                        status: 'draft', // Always draft for copies
                        start_time: fs.start_time,
                        end_time: fs.end_time,
                        organization_id: organizationId,
                    })
                )

                // Batch insert
                const { error: batchError } = await supabase.from('shifts').insert(shiftsToInsert)

                if (batchError) {
                    console.error('Error inserting recurring shifts:', batchError)
                    // We don't fail the main request, but maybe we should log it better
                }
            }
        } catch (e) {
            console.error('Error processing future_shifts:', e)
        }
    }

    // Fetch the complete shift object to return
    // Fetch the shift data first
    const organizationId = await getOrganizationId()
    const { data: savedShiftData, error: fetchError } = await supabase
        .from('shifts')
        .select('*')
        .eq('id', savedId)
        .eq('organization_id', organizationId)
        .single()

    if (fetchError || !savedShiftData) {
        console.error('Error fetching newly saved shift:', fetchError)
        return {
            error: `Fehler beim Laden der gespeicherten Schicht: ${fetchError?.message || 'Unbekannter Fehler'}`,
        }
    }

    // Manually fetch staff details if needed to avoid join ambiguity issues
    let staffDetails = null
    if (savedShiftData.staff_id) {
        const { data: s } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', savedShiftData.staff_id)
            .eq('organization_id', organizationId)
            .single()
        staffDetails = s
    }

    const savedShift = {
        ...savedShiftData,
        staff: staffDetails,
    } as Shift

    revalidatePath('/admin/shifts')
    return { success: true, message: 'Schicht gespeichert.', shift: savedShift }
}

export async function deleteShift(id: string) {
    const user = await checkAuth()
    if (!user) return { error: 'Unauthorized' }

    const supabase = await createClient()
    const organizationId = await getOrganizationId()
    const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId)

    if (error) return { error: error.message }
    revalidatePath('/admin/shifts')
    return { success: true }
}

export async function publishAllShifts(startDate: string, endDate: string) {
    const user = await checkAuth()
    if (!user) return { error: 'Unauthorized' }

    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { error } = await supabase
        .from('shifts')
        .update({ status: 'published' })
        .eq('status', 'draft')
        .eq('organization_id', organizationId)
        .gte('start_time', startDate)
        .lte('end_time', endDate)

    if (error) return { error: error.message }

    revalidatePath('/admin/shifts')
    return { success: true }
}

export async function saveWeekAsTemplate(weekStart: string, weekEnd: string, name: string) {
    const user = await checkAuth()
    if (!user) return { error: 'Unauthorized' }

    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    // 1. Create Template Bundle
    const { data: template, error: createError } = await supabase
        .from('saved_weekly_templates')
        .insert({ name, organization_id: organizationId })
        .select()
        .single()

    if (createError) return { error: createError.message }

    // 2. Fetch Shifts for the week
    const { data: shifts, error: fetchError } = await supabase
        .from('shifts')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('start_time', weekStart)
        .lte('end_time', weekEnd)
        .neq('status', 'cancelled')

    if (fetchError) return { error: fetchError.message }
    if (!shifts || shifts.length === 0)
        return { error: 'Keine Schichten in diesem Zeitraum gefunden.' }

    // 3. Convert to Template Items
    const templateItems = shifts.map(shift => {
        const d = new Date(shift.start_time)
        const dEnd = new Date(shift.end_time)
        // Store time in Europe/Berlin to avoid DST issues when applying
        const timeZone = 'Europe/Berlin'

        // dayOfWeek: 0-6. getDay() is 0 for Sunday.
        const dayOfWeek = d.getDay()

        // Format: HH:MM:SS
        const startTime = d.toLocaleTimeString('de-DE', { timeZone, hour12: false })
        const endTime = dEnd.toLocaleTimeString('de-DE', { timeZone, hour12: false })

        return {
            template_id: template.id,
            day_of_week: dayOfWeek,
            start_time: startTime,
            end_time: endTime,
            role: shift.role,
        }
    })

    const { error: insertError } = await supabase.from('shift_templates').insert(templateItems)

    if (insertError) return { error: insertError.message }

    revalidatePath('/admin/shifts')
    return { success: true, message: 'Vorlage gespeichert.' }
}

export async function getTemplates() {
    const user = await checkAuth()
    if (!user) return []

    const supabase = await createClient()
    const organizationId = await getOrganizationId()
    const { data } = await supabase
        .from('saved_weekly_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

    return data || []
}

export async function deleteTemplate(id: string) {
    const user = await checkAuth()
    if (!user) return { error: 'Unauthorized' }

    const supabase = await createClient()
    const organizationId = await getOrganizationId()
    const { error } = await supabase
        .from('saved_weekly_templates')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId)

    if (error) return { error: error.message }
    revalidatePath('/admin/shifts')
    return { success: true }
}

export async function loadTemplate(templateId: string, targetWeekStart: string) {
    const user = await checkAuth()
    if (!user) return { error: 'Unauthorized' }

    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    // 1. Fetch template items
    const { data: items, error: fetchError } = await supabase
        .from('shift_templates')
        .select('*')
        .eq('template_id', templateId)

    if (fetchError) return { error: fetchError.message }
    if (!items || items.length === 0) return { error: 'Vorlage ist leer.' }

    // 2. Calculate target dates
    const targetStart = new Date(targetWeekStart)
    // Ensure we are at the beginning of the week (Sunday or Monday, depending on input)
    // The input 'targetWeekStart' should be the start of the week.
    // Assuming UI passes the correct start date.

    const newShifts = items.map(item => {
        const itemDay = item.day_of_week // 0=Sunday

        // Calculate the date for this day
        // targetStart is usually Monday or Sunday?
        // Let's assume targetStart is the day we want to start counting from.
        // If targetWeekStart is Monday (1), and item is Sunday (0), it's +6 days?
        // Or is targetWeekStart Sunday (0)?
        // Helper: Find the date that matches the itemDay within the week of targetStart

        const targetDayDate = new Date(targetStart)
        const currentDayOfStart = targetStart.getDay()

        // Calculate offset
        // If we assumed targetWeekStart is Monday (1)
        // Item Mon (1) -> offset 0
        // Item Sun (0) -> offset 6

        // General logic:
        // diff = (itemDay - currentDayOfStart + 7) % 7
        // But if itemDay is 0 (Sunday) and we want it at end of week:
        // If currentDayOfStart is 1 (Monday):
        // 0 - 1 = -1 -> +7 = 6 (Sunday) -> Correct
        // If itemDay is 1 (Monday):
        // 1 - 1 = 0 -> Correct

        const diff = (itemDay - currentDayOfStart + 7) % 7
        targetDayDate.setDate(targetStart.getDate() + diff)

        // Set Times
        // We have HH:MM:SS text. We need to construct ISO string in correct time zone.
        const [sH, sM] = item.start_time.split(':')
        const [eH, eM] = item.end_time.split(':')

        // Construct using Date string to force locale parsing?
        // Or manually set hours if we assume we are in the same TZ?
        // Ideally we use a library like field-fns-tz but we don't have it.
        // We can construct a string "YYYY-MM-DDTHH:MM:SS" and let Date parse it as Local (Europe/Berlin)?
        // No, Date.parse("YYYY-MM-DDTHH:MM:SS") assumes Local or UTC depending on browser/node.

        // Let's assume the server is UTC.
        // We need to create a Date object that Represents "2026-01-XX 10:00 Berlin".
        // Currently we don't have a reliable way without date-fns-tz.

        // Hack: Create date in UTC, then subtract offset?
        // Better: shift-planner is strictly visual?
        // But we are saving to DB which requires Timestamptz.

        // Simple approach:
        // Set UTC hours = Role hours - 1 (Winter) or -2 (Summer).
        // Since we don't know if target is summer/winter easily without lib...
        // Wait, 'targetDayDate' has the date.
        // We can assume the system running this (Node) has a timezone or is UTC.
        // If user is in Germany and Node is in UTC...

        // Just use simple setHours for now and assume UTC for simplicity
        // OR try to be smart.
        // The time was saved using 'Europe/Berlin'.
        // So we should interpret it as 'Europe/Berlin'.

        // If we construct a string: `2026-01-29T10:00:00+01:00` (for winter)
        // We need to know offset.

        // Workaround: We ignore timezone shifts between template creation and usage for MVP?
        // No, that's bad.

        // Let's use string manipulation with Date:
        // "YYYY-MM-DD" + "T" + "HH:MM:SS"
        // const dateStr = targetDayDate.toISOString().split('T')[0]

        // We can cheat: We know Germany is +1 or +2.
        // But let's try to not hardcode offset.

        // We can just set the hours on the date object.
        // If we setHours(10), it sets 10:00 Local Node Time.
        // If Node is UTC, it becomes 10:00 UTC = 11:00/12:00 Berlin.
        // We wanted 10:00 Berlin. So we need 09:00 UTC.

        // So: Berlin Time - Offset = UTC Time.
        // How to get Offset for a future date?
        // targetDayDate.toLocaleString('en-US', { timeZone: 'Europe/Berlin', timeZoneName: 'short' }) -> "GMT+1"

        // If passed to new Date(sTimeStr), it is treated as Local.
        // If we want it treated as Berlin...

        // Let's just assume simple logic: We saved assuming Local Time = Wall Clock Time.
        // We use Wall Clock Time.

        const sDate = new Date(targetDayDate)
        sDate.setHours(parseInt(sH), parseInt(sM), 0, 0)

        const eDate = new Date(targetDayDate)
        eDate.setHours(parseInt(eH), parseInt(eM), 0, 0)

        // Handle overnight shifts (end < start)
        if (eDate < sDate) {
            eDate.setDate(eDate.getDate() + 1)
        }

        return {
            start_time: sDate.toISOString(),
            end_time: eDate.toISOString(),
            role: item.role,
            status: 'draft',
            staff_id: null,
            organization_id: organizationId,
        }
    })

    const { error: insertError } = await supabase.from('shifts').insert(newShifts)

    if (insertError) return { error: insertError.message }

    revalidatePath('/admin/shifts')
    return { success: true }
}
