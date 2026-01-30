'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================
// TYPES
// ============================================

export type ChecklistItemType = 'checkbox' | 'rating' | 'text' | 'multiselect'

export interface ChecklistTemplate {
    id: string
    organization_id: string
    name: string
    description: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface ChecklistItem {
    id: string
    template_id: string
    item_type: ChecklistItemType
    label: string
    description: string | null
    options: { options?: string[] } | null
    sort_order: number
    required: boolean
    created_at: string
}

export interface ChecklistResponse {
    id: string
    shift_checklist_id: string
    item_id: string
    staff_id: string
    response_value: ResponseValue
    completed_at: string
}

export type ResponseValue =
    | { checked: boolean }
    | { rating: number }
    | { text: string }
    | { selected: string }

export interface ShiftChecklist {
    id: string
    shift_id: string
    template_id: string
    assigned_at: string
    template?: ChecklistTemplate
    items?: ChecklistItem[]
    responses?: ChecklistResponse[]
}

// ============================================
// ADMIN: TEMPLATE MANAGEMENT
// ============================================

export async function getChecklistTemplates(): Promise<ChecklistTemplate[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('checklist_templates')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching checklist templates:', error)
        return []
    }

    return data || []
}

export async function getChecklistTemplate(
    id: string
): Promise<{ template: ChecklistTemplate | null; items: ChecklistItem[] }> {
    const supabase = await createClient()

    const { data: template, error: templateError } = await supabase
        .from('checklist_templates')
        .select('*')
        .eq('id', id)
        .single()

    if (templateError) {
        console.error('Error fetching checklist template:', templateError)
        return { template: null, items: [] }
    }

    const { data: items, error: itemsError } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('template_id', id)
        .order('sort_order', { ascending: true })

    if (itemsError) {
        console.error('Error fetching checklist items:', itemsError)
        return { template, items: [] }
    }

    return { template, items: items || [] }
}

export async function createChecklistTemplate(data: {
    name: string
    description?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
    const supabase = await createClient()

    // Get user's organization_id
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile) return { success: false, error: 'Profile not found' }

    const { data: template, error } = await supabase
        .from('checklist_templates')
        .insert({
            organization_id: profile.organization_id,
            name: data.name,
            description: data.description || null,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating checklist template:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/checklists')
    return { success: true, id: template.id }
}

export async function updateChecklistTemplate(
    id: string,
    data: { name?: string; description?: string; is_active?: boolean }
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase.from('checklist_templates').update(data).eq('id', id)

    if (error) {
        console.error('Error updating checklist template:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/checklists')
    revalidatePath(`/admin/checklists/${id}`)
    return { success: true }
}

export async function deleteChecklistTemplate(
    id: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase.from('checklist_templates').delete().eq('id', id)

    if (error) {
        console.error('Error deleting checklist template:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/checklists')
    return { success: true }
}

// ============================================
// ADMIN: ITEM MANAGEMENT
// ============================================

export async function addChecklistItem(
    templateId: string,
    item: {
        item_type: ChecklistItemType
        label: string
        description?: string
        options?: { options: string[] }
        required?: boolean
    }
): Promise<{ success: boolean; id?: string; error?: string }> {
    const supabase = await createClient()

    // Get current max sort_order
    const { data: existingItems } = await supabase
        .from('checklist_items')
        .select('sort_order')
        .eq('template_id', templateId)
        .order('sort_order', { ascending: false })
        .limit(1)

    const nextSortOrder =
        existingItems && existingItems.length > 0 ? existingItems[0].sort_order + 1 : 0

    const { data: newItem, error } = await supabase
        .from('checklist_items')
        .insert({
            template_id: templateId,
            item_type: item.item_type,
            label: item.label,
            description: item.description || null,
            options: item.options || null,
            sort_order: nextSortOrder,
            required: item.required ?? true,
        })
        .select()
        .single()

    if (error) {
        console.error('Error adding checklist item:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/admin/checklists/${templateId}`)
    return { success: true, id: newItem.id }
}

export async function updateChecklistItem(
    itemId: string,
    data: {
        label?: string
        description?: string
        options?: { options: string[] }
        required?: boolean
        sort_order?: number
    }
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase.from('checklist_items').update(data).eq('id', itemId)

    if (error) {
        console.error('Error updating checklist item:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/checklists')
    return { success: true }
}

export async function deleteChecklistItem(
    itemId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase.from('checklist_items').delete().eq('id', itemId)

    if (error) {
        console.error('Error deleting checklist item:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/checklists')
    return { success: true }
}

export async function reorderChecklistItems(
    items: { id: string; sort_order: number }[]
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    for (const item of items) {
        const { error } = await supabase
            .from('checklist_items')
            .update({ sort_order: item.sort_order })
            .eq('id', item.id)

        if (error) {
            console.error('Error reordering checklist item:', error)
            return { success: false, error: error.message }
        }
    }

    revalidatePath('/admin/checklists')
    return { success: true }
}

// ============================================
// ADMIN: SHIFT ASSIGNMENT
// ============================================

export async function assignChecklistToShift(
    shiftId: string,
    templateId: string
): Promise<{ success: boolean; id?: string; error?: string }> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('shift_checklists')
        .insert({
            shift_id: shiftId,
            template_id: templateId,
        })
        .select()
        .single()

    if (error) {
        console.error('Error assigning checklist to shift:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/shifts')
    revalidatePath('/staff/shifts')
    return { success: true, id: data.id }
}

export async function unassignChecklistFromShift(
    shiftChecklistId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase.from('shift_checklists').delete().eq('id', shiftChecklistId)

    if (error) {
        console.error('Error unassigning checklist from shift:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/shifts')
    revalidatePath('/staff/shifts')
    return { success: true }
}

// ============================================
// STAFF: CHECKLIST OPERATIONS
// ============================================

export async function getShiftChecklists(shiftId: string): Promise<
    Array<{
        id: string
        template: ChecklistTemplate
        items: ChecklistItem[]
        responses: ChecklistResponse[]
        progress: { completed: number; total: number }
    }>
> {
    const supabase = await createClient()

    // Get shift checklists
    const { data: shiftChecklists, error: scError } = await supabase
        .from('shift_checklists')
        .select(
            `
            id,
            template_id,
            checklist_templates (
                id,
                organization_id,
                name,
                description,
                is_active,
                created_at,
                updated_at
            )
        `
        )
        .eq('shift_id', shiftId)

    if (scError || !shiftChecklists) {
        console.error('Error fetching shift checklists:', scError)
        return []
    }

    const result = []

    for (const sc of shiftChecklists) {
        // Get items for this template
        const { data: items } = await supabase
            .from('checklist_items')
            .select('*')
            .eq('template_id', sc.template_id)
            .order('sort_order', { ascending: true })

        // Get responses for this shift checklist
        const { data: responses } = await supabase
            .from('checklist_responses')
            .select('*')
            .eq('shift_checklist_id', sc.id)

        const itemsList = items || []
        const responsesList = responses || []
        const requiredItems = itemsList.filter(i => i.required)

        // Calculate progress based on completed required items
        const completedCount = requiredItems.filter(item => {
            const response = responsesList.find(r => r.item_id === item.id)
            return response && isResponseComplete(response.response_value)
        }).length

        result.push({
            id: sc.id,
            template: sc.checklist_templates as unknown as ChecklistTemplate,
            items: itemsList,
            responses: responsesList,
            progress: {
                completed: completedCount,
                total: requiredItems.length,
            },
        })
    }

    return result
}

export async function submitChecklistResponse(
    shiftChecklistId: string,
    itemId: string,
    value: ResponseValue
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // Upsert: Insert or update the response
    const { error } = await supabase.from('checklist_responses').upsert(
        {
            shift_checklist_id: shiftChecklistId,
            item_id: itemId,
            staff_id: user.id,
            response_value: value,
            completed_at: new Date().toISOString(),
        },
        {
            onConflict: 'shift_checklist_id,item_id',
        }
    )

    if (error) {
        console.error('Error submitting checklist response:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/staff/shifts')
    revalidatePath('/staff/checklists')
    return { success: true }
}

// ============================================
// HELPERS
// ============================================

function isResponseComplete(value: ResponseValue): boolean {
    if ('checked' in value) {
        return value.checked === true
    }
    if ('rating' in value) {
        return value.rating > 0
    }
    if ('text' in value) {
        return value.text.trim().length > 0
    }
    if ('selected' in value) {
        return value.selected.trim().length > 0
    }
    return false
}

export async function getChecklistProgress(
    shiftChecklistId: string
): Promise<{ completed: number; total: number; percentage: number }> {
    const supabase = await createClient()

    // Get the shift checklist to find the template
    const { data: shiftChecklist } = await supabase
        .from('shift_checklists')
        .select('template_id')
        .eq('id', shiftChecklistId)
        .single()

    if (!shiftChecklist) return { completed: 0, total: 0, percentage: 0 }

    // Get required items
    const { data: items } = await supabase
        .from('checklist_items')
        .select('id')
        .eq('template_id', shiftChecklist.template_id)
        .eq('required', true)

    const totalItems = items?.length || 0

    // Get completed responses
    const { data: responses } = await supabase
        .from('checklist_responses')
        .select('item_id, response_value')
        .eq('shift_checklist_id', shiftChecklistId)

    const completedCount = responses?.filter(r => isResponseComplete(r.response_value)).length || 0

    return {
        completed: completedCount,
        total: totalItems,
        percentage: totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0,
    }
}
