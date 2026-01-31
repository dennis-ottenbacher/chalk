'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    User,
    Clock,
    Send,
    Loader2,
    AlertTriangle,
} from 'lucide-react'
import { Shift, StaffEvent, publishAllShifts } from '@/app/actions/shifts'
import { ShiftDialog } from './shift-dialog'
import { TemplateManager } from './template-manager'
import { cn } from '@/lib/utils'

type ShiftPlannerProps = {
    initialShifts: Shift[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    staffMembers: any[]
    currentDate: string | Date
    staffEvents: StaffEvent[]
}

function addDays(date: Date, days: number) {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
}

function getStartOfWeek(date: Date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
}

function isSameDay(d1: Date, d2: Date) {
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    )
}

export default function ShiftPlanner({
    initialShifts,
    staffMembers,
    currentDate,
    staffEvents,
}: ShiftPlannerProps) {
    const router = useRouter()

    const [shifts, setShifts] = useState<Shift[]>(initialShifts)

    // Sync with server if props change (e.g. from router.refresh or navigation)
    useEffect(() => {
        setShifts(initialShifts)
    }, [initialShifts])

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedShift, setSelectedShift] = useState<Shift | undefined>(undefined)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

    // Action State
    const [isPublishing, setIsPublishing] = useState(false)

    const activeDate = new Date(currentDate)
    const startDate = getStartOfWeek(activeDate)
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i))

    const handleNavigate = (direction: 'prev' | 'next') => {
        const newDate = addDays(activeDate, direction === 'next' ? 7 : -7)
        router.push(`/admin/shifts?date=${newDate.toISOString()}`)
    }

    const handleEditShift = (shift: Shift) => {
        setSelectedShift(shift)
        setSelectedDate(new Date(shift.start_time))
        setIsDialogOpen(true)
    }

    const handleAddShift = (date: Date) => {
        setSelectedShift(undefined)
        setSelectedDate(date)
        setIsDialogOpen(true)
    }

    const handlePublishAll = async () => {
        if (!confirm('Möchten Sie alle Entwürfe dieser Woche veröffentlichen?')) return

        setIsPublishing(true)
        try {
            const weekEnd = new Date(weekDays[6])
            weekEnd.setHours(23, 59, 59, 999)

            await publishAllShifts(startDate.toISOString(), weekEnd.toISOString())
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Fehler beim Veröffentlichen')
        } finally {
            setIsPublishing(false)
        }
    }

    const handleShiftSaved = (savedShift: Shift) => {
        setShifts(prev => {
            const exists = prev.find(s => s.id === savedShift.id)
            if (exists) {
                return prev.map(s => (s.id === savedShift.id ? savedShift : s))
            }
            return [...prev, savedShift]
        })
    }

    const handleShiftDeleted = (id: string) => {
        setShifts(prev => prev.filter(s => s.id !== id))
    }

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleNavigate('prev')}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Woche zurück
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/shifts`)}
                    >
                        Heute
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleNavigate('next')}>
                        Nächste Woche <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <TemplateManager
                        weekStart={startDate}
                        weekEnd={(() => {
                            const e = new Date(weekDays[6])
                            e.setHours(23, 59, 59, 999)
                            return e
                        })()}
                        onSuccess={() => {
                            // Fetch shifts again?
                            // router.refresh() handles server props update
                            // But we also need to update local state if we loaded templates?
                            // Router refresh might take time.
                            // Ideally standard pattern: router.refresh()
                            router.refresh()
                        }}
                    />
                    <Button
                        size="sm"
                        variant="default"
                        onClick={handlePublishAll}
                        disabled={isPublishing}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {isPublishing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4 mr-2" />
                        )}
                        Veröffentlichen
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 h-full min-h-[600px] border rounded-lg p-2 bg-muted/10 overflow-x-auto">
                {weekDays.map(day => {
                    // Use local state 'shifts' instead of prop
                    const dayShifts = shifts.filter(s => isSameDay(new Date(s.start_time), day))
                    const isToday = isSameDay(day, new Date())
                    const dayStart = new Date(day)
                    dayStart.setHours(0, 0, 0, 0)
                    const dayEnd = new Date(day)
                    dayEnd.setHours(23, 59, 59, 999)
                    const dayEvents = staffEvents.filter(
                        e => new Date(e.start_time) <= dayEnd && new Date(e.end_time) >= dayStart
                    )

                    return (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                'flex flex-col gap-2 min-w-[150px]',
                                isToday && 'bg-accent/10 rounded-md'
                            )}
                        >
                            <div
                                className={cn(
                                    'p-2 text-center border-b font-medium rounded-t-md',
                                    isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                )}
                            >
                                <div className="text-sm">
                                    {new Intl.DateTimeFormat('de-DE', { weekday: 'long' }).format(
                                        day
                                    )}
                                </div>
                                <div className="text-xs opacity-80">
                                    {new Intl.DateTimeFormat('de-DE').format(day)}
                                </div>
                            </div>

                            <div className="flex-1 space-y-2 p-1">
                                {dayShifts.map(shift => (
                                    <div
                                        key={shift.id}
                                        onClick={() => handleEditShift(shift)}
                                        className={cn(
                                            'flex flex-col gap-1 p-2 rounded-md border text-sm cursor-pointer hover:border-primary transition-colors shadow-sm',
                                            shift.status === 'draft'
                                                ? 'bg-warning/10 border-warning/30 dark:bg-warning/10'
                                                : 'bg-card',
                                            shift.staff_id === null ? 'border-dashed border-2' : ''
                                        )}
                                    >
                                        {/* Conflict Check */}
                                        {(() => {
                                            if (!shift.staff_id) return null
                                            const conflicts = staffEvents.filter(
                                                e =>
                                                    e.staff_id === shift.staff_id &&
                                                    new Date(e.start_time) <
                                                        new Date(shift.end_time) &&
                                                    new Date(e.end_time) >
                                                        new Date(shift.start_time)
                                            )
                                            if (conflicts.length === 0) return null
                                            return (
                                                <div
                                                    className="absolute -top-1 -right-1 z-10"
                                                    title={`Conflict: ${conflicts.map(c => c.event_description).join(', ')}`}
                                                >
                                                    <AlertTriangle className="h-5 w-5 text-destructive bg-white dark:bg-slate-800 rounded-full border border-destructive p-0.5" />
                                                </div>
                                            )
                                        })()}

                                        <div className="flex items-center justify-between font-semibold">
                                            <span>{shift.role}</span>
                                            {shift.status === 'draft' && (
                                                <span className="text-[10px] bg-warning/15 text-warning px-1 rounded">
                                                    Entwurf
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center text-xs text-muted-foreground gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(shift.start_time).toLocaleTimeString(
                                                'de-DE',
                                                { hour: '2-digit', minute: '2-digit' }
                                            )}{' '}
                                            -
                                            {new Date(shift.end_time).toLocaleTimeString('de-DE', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                        <div
                                            className={cn(
                                                'flex items-center text-xs gap-1 mt-1',
                                                !shift.staff_id ? 'text-orange-600 font-medium' : ''
                                            )}
                                        >
                                            <User className="w-3 h-3" />
                                            {shift.staff
                                                ? `${shift.staff.first_name} ${shift.staff.last_name?.[0]}.`
                                                : 'Offen'}
                                        </div>
                                    </div>
                                ))}

                                {dayEvents.length > 0 && (
                                    <div className="rounded-md border border-dashed bg-muted/40 p-2 text-xs text-muted-foreground">
                                        <div className="mb-1 font-medium text-foreground/80">
                                            Abwesenheiten
                                        </div>
                                        <div className="space-y-1">
                                            {dayEvents.map(event => {
                                                const staff = staffMembers.find(
                                                    s => s.id === event.staff_id
                                                )
                                                const staffLabel = staff
                                                    ? `${staff.first_name ?? ''} ${staff.last_name ?? ''}`.trim()
                                                    : 'Unbekannt'
                                                return (
                                                    <div key={event.id} className="flex flex-col">
                                                        <span className="font-medium text-foreground/80">
                                                            {staffLabel || 'Unbekannt'}
                                                        </span>
                                                        <span>{event.event_description}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                <Button
                                    variant="ghost"
                                    className="w-full h-8 text-xs border border-dashed text-muted-foreground hover:text-primary"
                                    onClick={() => handleAddShift(day)}
                                >
                                    <Plus className="w-3 h-3 mr-1" /> Schicht
                                </Button>
                            </div>
                        </div>
                    )
                })}
            </div>

            <ShiftDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                shift={selectedShift}
                defaultDate={selectedDate}
                staffMembers={staffMembers}
                onSave={handleShiftSaved}
                onDelete={handleShiftDeleted}
            />
        </div>
    )
}
