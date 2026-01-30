'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, UserCheck, AlertCircle } from 'lucide-react'
import { claimShift, releaseShift } from '@/app/actions/staff-shifts'

import { cn } from '@/lib/utils'

type Shift = {
    id: string
    start_time: string
    end_time: string
    role: string
    notes: string | null
    status: 'draft' | 'published' | 'cancelled'
    staff_id: string | null
}

export function ShiftsList({ myShifts, openShifts }: { myShifts: Shift[]; openShifts: Shift[] }) {
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleClaim = async (id: string) => {
        setLoadingId(id)
        setError(null)
        try {
            const res = await claimShift(id)
            if (res.error) setError(res.error)
        } finally {
            setLoadingId(null)
        }
    }

    const handleRelease = async (id: string) => {
        if (!confirm('Willst du diese Schicht wirklich abgeben?')) return
        setLoadingId(id)
        setError(null)
        try {
            const res = await releaseShift(id)
            if (res.error) setError(res.error)
        } finally {
            setLoadingId(null)
        }
    }

    const ShiftCard = ({ shift, isOpen }: { shift: Shift; isOpen: boolean }) => {
        const start = new Date(shift.start_time)
        const end = new Date(shift.end_time)
        const isPast = end < new Date()

        return (
            <Card
                className={cn(
                    'mb-4 transition-all hover:shadow-md',
                    isOpen ? 'border-dashed border-primary/50' : 'border-l-4 border-l-primary'
                )}
            >
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant={isOpen ? 'outline' : 'default'}>{shift.role}</Badge>
                            {isPast && <Badge variant="secondary">Vergangen</Badge>}
                        </div>

                        <div className="flex items-center gap-2 font-medium">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {start.toLocaleDateString('de-DE', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                            })}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {start.toLocaleTimeString('de-DE', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}{' '}
                            -{' '}
                            {end.toLocaleTimeString('de-DE', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </div>

                        {shift.notes && (
                            <div className="text-xs text-muted-foreground italic mt-2">
                                &quot;{shift.notes}&quot;
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 min-w-[120px]">
                        {isOpen ? (
                            <Button
                                size="sm"
                                onClick={() => handleClaim(shift.id)}
                                disabled={!!loadingId}
                            >
                                {loadingId === shift.id ? '...' : 'Übernehmen'}
                            </Button>
                        ) : !isPast ? (
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleRelease(shift.id)}
                                disabled={!!loadingId}
                            >
                                {loadingId === shift.id ? '...' : 'Abgeben'}
                            </Button>
                        ) : null}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="flex flex-col lg:flex-row lg:gap-8 items-start">
            <div className="flex-1 space-y-8 w-full">
                {error && (
                    <div className="bg-destructive/15 text-destructive p-3 rounded-md flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> {error}
                    </div>
                )}

                <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <UserCheck className="h-5 w-5" /> Meine Schichten
                    </h2>
                    {myShifts.length === 0 ? (
                        <p className="text-muted-foreground italic">Keine kommenden Schichten.</p>
                    ) : (
                        myShifts.map(shift => (
                            <ShiftCard key={shift.id} shift={shift} isOpen={false} />
                        ))
                    )}
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-primary">
                        <MapPin className="h-5 w-5" /> Verfügbare Schichten
                    </h2>
                    {openShifts.length === 0 ? (
                        <p className="text-muted-foreground italic">
                            Aktuell keine offenen Schichten verfügbar.
                        </p>
                    ) : (
                        openShifts.map(shift => (
                            <ShiftCard key={shift.id} shift={shift} isOpen={true} />
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
