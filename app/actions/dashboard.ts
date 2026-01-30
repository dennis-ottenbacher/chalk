'use server'

import { createClient } from '@/utils/supabase/server'
import { getOrganizationId } from '@/lib/get-organization'

export type DashboardStats = {
    activeMembers: number
    todaysCheckins: number
    todaysRevenue: number
    openShifts: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    // Date calculations for "Today" (UTC or Local? DB is typically UTC)
    // We'll use start of day UTC for simplicity, or try to be more precise if we knew timezone.
    // Ideally we should use user's timezone, but for now strict UTC dates for 'today' might suffice or depend on how data is stored.
    // 'transactions' and 'checkins' use ISO strings.
    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    // 1. Active Members
    // Counting profiles with role 'member' or 'athlete'
    const { count: activeMembers, error: membersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .in('role', ['member', 'athlete'])

    // 2. Today's Checkins
    const { count: todaysCheckins, error: checkinsError } = await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'valid')
        .gte('timestamp', startOfDay.toISOString())
        .lte('timestamp', endOfDay.toISOString())

    // 3. Today's Revenue
    // Sum total_amount from transactions
    const { data: transactions, error: revenueError } = await supabase
        .from('transactions')
        .select('total_amount')
        .eq('organization_id', organizationId)
        .eq('status', 'completed')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())

    const todaysRevenue = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0

    // 4. Open Shifts
    // Shifts in the future that are not assigned (staff_id is null) and not cancelled
    const { count: openShifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .is('staff_id', null)
        .neq('status', 'cancelled')
        .gte('start_time', now.toISOString())

    if (membersError) console.error('Error fetching active members:', membersError)
    if (checkinsError) console.error("Error fetching today's checkins:", checkinsError)
    if (revenueError) console.error('Error fetching revenue:', revenueError)
    if (shiftsError) console.error('Error fetching open shifts:', shiftsError)

    return {
        activeMembers: activeMembers || 0,
        todaysCheckins: todaysCheckins || 0,
        todaysRevenue: todaysRevenue,
        openShifts: openShifts || 0,
    }
}
