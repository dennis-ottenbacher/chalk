'use client'

import { useState } from 'react'
import { LayoutList, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StaffCalendar } from './staff-calendar'
import { ShiftsList } from '@/app/staff/shifts-list'
import { Shift } from '@/app/actions/shifts'

type ViewMode = 'list' | 'calendar'

type StaffShiftsViewProps = {
    myShifts: Shift[]
    openShifts: Shift[]
}

export function StaffShiftsView({ myShifts, openShifts }: StaffShiftsViewProps) {
    const [view, setView] = useState<ViewMode>('list')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Schichtplan Übersicht</h1>
                    <p className="text-muted-foreground mt-1">
                        Hier siehst du deine kommenden Schichten und kannst offene Schichten
                        übernehmen.
                    </p>
                </div>
                <div className="flex items-center bg-muted p-1 rounded-lg border">
                    <Button
                        variant={view === 'list' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setView('list')}
                        className="gap-2"
                    >
                        <LayoutList className="h-4 w-4" />
                        Liste
                    </Button>
                    <Button
                        variant={view === 'calendar' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setView('calendar')}
                        className="gap-2"
                    >
                        <CalendarIcon className="h-4 w-4" />
                        Kalender
                    </Button>
                </div>
            </div>

            <div className="min-h-[500px]">
                {view === 'list' ? (
                    <ShiftsList myShifts={myShifts} openShifts={openShifts} />
                ) : (
                    <StaffCalendar myShifts={myShifts} openShifts={openShifts} />
                )}
            </div>
        </div>
    )
}
