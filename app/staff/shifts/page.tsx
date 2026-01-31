import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { StaffShiftsView } from '@/components/staff/shifts/staff-shifts-view'

export default async function ShiftsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // 1. My Upcoming Shifts
    const { data: myShifts, error: myShiftsError } = await supabase
        .from('shifts')
        .select('*')
        .eq('staff_id', user.id)
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true })

    // 2. Open Published Shifts (Available to grab)
    const { data: openShifts, error: openShiftsError } = await supabase
        .from('shifts')
        .select('*')
        .is('staff_id', null)
        .eq('status', 'published')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })

    if (myShiftsError) console.error('My Shifts error:', myShiftsError)
    if (openShiftsError) console.error('Open Shifts error:', openShiftsError)

    return (
        <div className="h-full overflow-y-auto p-8">
            <StaffShiftsView myShifts={myShifts || []} openShifts={openShifts || []} />
        </div>
    )
}
