import { Suspense } from 'react'
import { getShifts, getStaffMembers, getStaffEvents } from '@/app/actions/shifts'
import ShiftPlanner from '@/components/admin/shifts/shift-planner'

// Date helpers
function getStartOfWeek(date: Date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
}

function getEndOfWeek(date: Date) {
    const start = getStartOfWeek(date)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return end
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date)
}

function getWeekNumber(d: Date) {
    const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
    const weekNo = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
    return weekNo
}

export default async function ShiftsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams
    const dateParam = typeof params.date === 'string' ? params.date : new Date().toISOString()

    const today = new Date(dateParam)
    const startDate = getStartOfWeek(today)
    const endDate = getEndOfWeek(today)

    // Fetch data
    const shifts = await getShifts(startDate.toISOString(), endDate.toISOString())
    const staff = await getStaffMembers()
    const staffEvents = await getStaffEvents(startDate.toISOString(), endDate.toISOString())

    return (
        <div className="flex flex-col h-full space-y-4 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Schichtplan</h2>
                    <p className="text-muted-foreground">
                        KW {getWeekNumber(startDate)} ({formatDate(startDate)} -{' '}
                        {formatDate(endDate)})
                    </p>
                </div>
            </div>

            <div className="flex-1 h-full min-h-[500px]">
                <Suspense fallback={<div>Laden...</div>}>
                    <ShiftPlanner
                        initialShifts={shifts}
                        staffMembers={staff}
                        currentDate={today.toISOString()}
                        staffEvents={staffEvents}
                    />
                </Suspense>
            </div>
        </div>
    )
}
