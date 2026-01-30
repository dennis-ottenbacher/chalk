'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    User,
    AlertCircle,
    Calendar as CalendarIcon,
    Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { claimShift, releaseShift } from '@/app/actions/staff-shifts'
import { Shift } from '@/app/actions/shifts'
import { Modal } from '@/components/ui/modal'

type StaffCalendarProps = {
    myShifts: Shift[]
    openShifts: Shift[]
}

function addDays(date: Date, days: number) {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
}

function getStartOfWeek(date: Date) {
    const d = new Date(date)
    const day = d.getDay() // 0 = Sunday
    // We want Monday as start of week?
    // ShiftPlanner used: d.getDate() - day + (day === 0 ? -6 : 1)
    // If day is 0 (Sun): -6 -> Monday of previous/current week?
    // If day is 1 (Mon): +1 -> Wait.
    // If day is 1: getDate - 1 + 1 = getDate. Correct.
    // If day is 0: getDate - 0 - 6 = Previous Monday. Correct.

    // So yes, Monday start.
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

export function StaffCalendar({ myShifts, openShifts }: StaffCalendarProps) {
    const router = useRouter()

    // We maintain our own simple internal date state for navigation
    // Default to today
    const [currentDate, setCurrentDate] = useState(new Date())

    const activeDate = new Date(currentDate)
    const startDate = getStartOfWeek(activeDate)
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i))

    // State for interactive dialog
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
        if (direction === 'today') {
            setCurrentDate(new Date())
        } else {
            setCurrentDate(prev => addDays(prev, direction === 'next' ? 7 : -7))
        }
    }

    const handleShiftClick = (shift: Shift) => {
        setSelectedShift(shift)
        setError(null)
        setIsDialogOpen(true)
    }

    const onClaim = async () => {
        if (!selectedShift) return
        setIsLoading(true)
        setError(null)
        try {
            const res = await claimShift(selectedShift.id)
            if (res.error) {
                setError(res.error)
            } else {
                setIsDialogOpen(false)
                router.refresh()
            }
        } catch {
            setError('Ein Fehler ist aufgetreten.')
        } finally {
            setIsLoading(false)
        }
    }

    const onRelease = async () => {
        if (!selectedShift) return
        setIsLoading(true)
        setError(null)
        try {
            const res = await releaseShift(selectedShift.id)
            if (res.error) {
                setError(res.error)
            } else {
                setIsDialogOpen(false)
                router.refresh()
            }
        } catch {
            setError('Ein Fehler ist aufgetreten.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full gap-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between bg-card p-2 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleNavigate('prev')}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm font-medium flex items-center gap-2 min-w-[140px] justify-center">
                        <CalendarIcon className="h-4 w-4 opacity-50" />
                        {startDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleNavigate('next')}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleNavigate('today')}>
                    Heute
                </Button>
            </div>

            <div className="grid grid-cols-7 gap-2 h-full min-h-[600px] border rounded-lg p-2 bg-muted/10 overflow-x-auto">
                {weekDays.map(day => {
                    // Combine and filter shifts for this day
                    const dayMyShifts = myShifts.filter(s => isSameDay(new Date(s.start_time), day))
                    const dayOpenShifts = openShifts.filter(s =>
                        isSameDay(new Date(s.start_time), day)
                    )
                    const allDayShifts = [...dayMyShifts, ...dayOpenShifts].sort(
                        (a, b) =>
                            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
                    )

                    const isToday = isSameDay(day, new Date())

                    return (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                'flex flex-col gap-2 min-w-[140px]',
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
                                    {new Intl.DateTimeFormat('de-DE', { weekday: 'short' }).format(
                                        day
                                    )}
                                </div>
                                <div className="text-xs opacity-80">
                                    {new Intl.DateTimeFormat('de-DE', {
                                        day: '2-digit',
                                        month: '2-digit',
                                    }).format(day)}
                                </div>
                            </div>

                            <div className="flex-1 space-y-2 p-1">
                                {allDayShifts.length === 0 && (
                                    <div className="text-xs text-muted-foreground text-center py-4 italic opacity-50">
                                        -
                                    </div>
                                )}
                                {allDayShifts.map(shift => {
                                    const isMine = myShifts.some(s => s.id === shift.id)
                                    return (
                                        <div
                                            key={shift.id}
                                            onClick={() => handleShiftClick(shift)}
                                            className={cn(
                                                'flex flex-col gap-1 p-2 rounded-md border text-sm cursor-pointer transition-all hover:scale-[1.02] shadow-sm',
                                                isMine
                                                    ? 'bg-primary/5 border-primary/20 hover:border-primary/50'
                                                    : 'bg-card border-dashed hover:border-solid hover:border-primary/50 opacity-90'
                                            )}
                                        >
                                            <div className="flex items-center justify-between font-semibold">
                                                <span
                                                    className={cn(
                                                        isMine ? 'text-primary' : 'text-foreground'
                                                    )}
                                                >
                                                    {shift.role}
                                                </span>
                                            </div>
                                            <div className="flex items-center text-xs text-muted-foreground gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(shift.start_time).toLocaleTimeString(
                                                    'de-DE',
                                                    { hour: '2-digit', minute: '2-digit' }
                                                )}{' '}
                                                -
                                                {new Date(shift.end_time).toLocaleTimeString(
                                                    'de-DE',
                                                    { hour: '2-digit', minute: '2-digit' }
                                                )}
                                            </div>
                                            <div
                                                className={cn(
                                                    'flex items-center text-xs gap-1 mt-1',
                                                    isMine
                                                        ? 'text-primary font-medium'
                                                        : 'text-muted-foreground/70'
                                                )}
                                            >
                                                <User className="w-3 h-3" />
                                                {isMine ? 'Meine Schicht' : 'Verfügbar'}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            <Modal
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title="Schicht Details"
            >
                {selectedShift && (
                    <div className="space-y-4">
                        <div className="p-4 bg-muted/20 rounded-lg border space-y-3">
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="font-semibold text-lg">{selectedShift.role}</span>
                                <div className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                                    {new Date(selectedShift.start_time).toLocaleDateString(
                                        'de-DE',
                                        { weekday: 'long', day: '2-digit', month: 'long' }
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">
                                        Start
                                    </span>
                                    <span className="font-mono">
                                        {new Date(selectedShift.start_time).toLocaleTimeString(
                                            'de-DE',
                                            { hour: '2-digit', minute: '2-digit' }
                                        )}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">
                                        Ende
                                    </span>
                                    <span className="font-mono">
                                        {new Date(selectedShift.end_time).toLocaleTimeString(
                                            'de-DE',
                                            { hour: '2-digit', minute: '2-digit' }
                                        )}
                                    </span>
                                </div>
                            </div>
                            {selectedShift.notes && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded text-sm text-yellow-800 dark:text-yellow-200 border border-yellow-100 dark:border-yellow-900/20">
                                    <span className="block font-semibold text-xs mb-1 opacity-70">
                                        Notizen:
                                    </span>
                                    {selectedShift.notes}
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="ghost"
                                onClick={() => setIsDialogOpen(false)}
                                disabled={isLoading}
                            >
                                Abbrechen
                            </Button>

                            {selectedShift && myShifts.some(s => s.id === selectedShift.id) ? (
                                <Button
                                    variant="destructive"
                                    onClick={onRelease}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : null}
                                    Schicht abgeben
                                </Button>
                            ) : (
                                <Button onClick={onClaim} disabled={isLoading}>
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : null}
                                    Schicht übernehmen
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}
