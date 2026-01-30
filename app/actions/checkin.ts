'use server'

import { createClient } from '@/utils/supabase/server'
import { getOrganizationId } from '@/lib/get-organization'

export async function checkInUser(identifier: string) {
    const supabase = await createClient()

    const organizationId = await getOrganizationId()

    // 1. Find Profile by Member ID
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('member_id', identifier)
        .eq('organization_id', organizationId)
        .single()

    if (profileError || !profile) {
        return {
            success: false,
            message: 'Mitgliedsnummer nicht gefunden.',
        }
    }

    // 2. Find Active Subscription
    // Logic: Look for any subscription that is active AND (end_date in future OR remaining_entries > 0)
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*, products(name)')
        .eq('user_id', profile.id)
        .eq('is_active', true)
        .eq('organization_id', organizationId)
        .single() // Simplify: Assume one active sub for now

    // Log Check-in Attempt
    const checkinData = {
        user_id: profile.id,
        processed_by: null, // TODO: Add current staff user
        location_id: 'front_desk',
        timestamp: new Date().toISOString(),
        status: 'invalid' as 'valid' | 'invalid',
        organization_id: organizationId,
    }

    // CASE A: No Subscription
    if (!subscription) {
        await supabase.from('checkins').insert(checkinData)
        return {
            success: false,
            message: 'Kein aktives Abo gefunden.',
            user: {
                firstName: profile.first_name || '',
                lastName: profile.last_name || '',
                role: profile.role || 'member',
                memberId: profile.member_id || '',
                avatarUrl: profile.avatar_url || '',
            },
        }
    }

    // CASE B: 10er Karte (Entries Logic)
    if (subscription.remaining_entries !== null) {
        if (subscription.remaining_entries > 0) {
            // Decrement
            const newVal = subscription.remaining_entries - 1
            await supabase
                .from('subscriptions')
                .update({ remaining_entries: newVal })
                .eq('id', subscription.id)
                .eq('organization_id', organizationId)

            checkinData.status = 'valid'
            await supabase.from('checkins').insert(checkinData)

            return {
                success: true,
                message: 'Eintritt abgebucht.',
                tariffName: subscription.products?.name,
                remainingEntries: newVal,
                user: {
                    firstName: profile.first_name || '',
                    lastName: profile.last_name || '',
                    role: profile.role || 'member',
                    memberId: profile.member_id || '',
                    avatarUrl: profile.avatar_url || '',
                },
            }
        } else {
            // Empty
            await supabase.from('checkins').insert(checkinData)
            return {
                success: false,
                message: 'Karte leer (0 Einträge).',
                tariffName: subscription.products?.name,
                remainingEntries: 0,
                user: {
                    firstName: profile.first_name || '',
                    lastName: profile.last_name || '',
                    role: profile.role || 'member',
                    memberId: profile.member_id || '',
                    avatarUrl: profile.avatar_url || '',
                },
            }
        }
    }

    // CASE C: Time-based Subscription (End Date Logic)
    if (subscription.end_date) {
        const end = new Date(subscription.end_date)
        const now = new Date()

        if (end < now) {
            await supabase.from('checkins').insert(checkinData)
            return {
                success: false,
                message: `Abo abgelaufen am ${end.toLocaleDateString()}`,
                tariffName: subscription.products?.name,
                user: {
                    firstName: profile.first_name || '',
                    lastName: profile.last_name || '',
                    role: profile.role || 'member',
                    memberId: profile.member_id || '',
                    avatarUrl: profile.avatar_url || '',
                },
            }
        }
    }

    // Success (Valid Time-based Sub)
    checkinData.status = 'valid'
    await supabase.from('checkins').insert(checkinData)

    return {
        success: true,
        message: 'Viel Spaß beim Bouldern!',
        tariffName: subscription.products?.name,
        user: {
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            role: profile.role || 'member',
            memberId: profile.member_id || '',
            avatarUrl: profile.avatar_url || '',
        },
    }
}
