import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getShiftChecklists } from '@/app/actions/checklists'
import { ShiftChecklistsView } from '@/components/staff/checklists/shift-checklists-view'

export default async function StaffChecklistsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Get the current active shift for this user
    const now = new Date().toISOString()
    const { data: currentShift } = await supabase
        .from('shifts')
        .select('*')
        .eq('staff_id', user.id)
        .lte('start_time', now)
        .gte('end_time', now)
        .order('start_time', { ascending: true })
        .limit(1)
        .single()

    // If no active shift, get the closest upcoming shift
    let shiftToShow = currentShift
    if (!currentShift) {
        const { data: upcomingShift } = await supabase
            .from('shifts')
            .select('*')
            .eq('staff_id', user.id)
            .gte('start_time', now)
            .order('start_time', { ascending: true })
            .limit(1)
            .single()
        shiftToShow = upcomingShift
    }

    // Get checklists for the shift
    const checklists = shiftToShow ? await getShiftChecklists(shiftToShow.id) : []

    return (
        <div className="flex flex-col h-full space-y-6 p-8 overflow-y-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Checklisten</h1>
                <p className="text-muted-foreground">
                    {shiftToShow
                        ? `Schicht: ${new Date(shiftToShow.start_time).toLocaleDateString('de-DE')} (${shiftToShow.role})`
                        : 'Keine aktive Schicht'}
                </p>
            </div>

            <ShiftChecklistsView shiftId={shiftToShow?.id} checklists={checklists} />
        </div>
    )
}
