'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Shift, saveShift, deleteShift } from '@/app/actions/shifts'
import { Input } from '@/components/ui/input'
import { X, Trash2, Loader2, ClipboardList } from 'lucide-react'
import {
    getChecklistTemplates,
    assignChecklistToShift,
    unassignChecklistFromShift,
    ChecklistTemplate,
} from '@/app/actions/checklists'

// Custom simplified Modal since Dialog component is missing
function Modal({
    open,
    onClose,
    children,
    title,
}: {
    open: boolean
    onClose: () => void
    children: React.ReactNode
    title: string
}) {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background rounded-lg shadow-lg w-full max-w-md border animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background">
                    <h3 className="font-semibold text-lg">{title}</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>
    )
}

type ShiftDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    shift?: Shift & { shift_checklists?: Array<{ id: string; template_id: string }> }
    defaultDate?: Date
    staffMembers: Array<{
        id: string
        first_name: string
        last_name: string
        staff_roles?: Array<{ role: string }>
    }>
    onSave?: (shift: Shift) => void
    onDelete?: (id: string) => void
}

export function ShiftDialog({
    open,
    onOpenChange,
    shift,
    defaultDate,
    staffMembers,
    onSave,
    onDelete,
}: ShiftDialogProps) {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form State
    const [role, setRole] = useState('Service')
    const [staffId, setStaffId] = useState<string>('open')
    const [startTime, setStartTime] = useState('08:00')
    const [endTime, setEndTime] = useState('16:00')
    const [status, setStatus] = useState<string>('draft')
    const [notes, setNotes] = useState('')
    const [repeatWeekly, setRepeatWeekly] = useState(false)

    // Checklist State
    const [availableChecklists, setAvailableChecklists] = useState<ChecklistTemplate[]>([])
    const [selectedChecklistIds, setSelectedChecklistIds] = useState<string[]>([])
    const [loadingChecklists, setLoadingChecklists] = useState(false)

    // Load available checklists
    useEffect(() => {
        if (open) {
            setLoadingChecklists(true)
            getChecklistTemplates().then(templates => {
                setAvailableChecklists(templates.filter(t => t.is_active))
                setLoadingChecklists(false)
            })
        }
    }, [open])

    useEffect(() => {
        if (open) {
            setError(null)
            if (shift) {
                // Edit Mode
                const start = new Date(shift.start_time)
                const end = new Date(shift.end_time)
                setRole(shift.role)
                setStaffId(shift.staff_id || 'open')
                setStartTime(
                    start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                )
                setEndTime(end.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }))
                setStatus(shift.status)
                setNotes(shift.notes || '')
                // Load existing checklist assignments
                setSelectedChecklistIds(shift.shift_checklists?.map(sc => sc.template_id) || [])
            } else {
                // Create Mode defaults
                setRole('Service')
                setStaffId('open')
                setStartTime('08:00')
                setEndTime('16:00')
                setStatus('draft')
                setNotes('')
                setRepeatWeekly(false)
                setSelectedChecklistIds([])
            }
        }
    }, [open, shift])

    const toggleChecklist = (templateId: string) => {
        setSelectedChecklistIds(prev =>
            prev.includes(templateId) ? prev.filter(id => id !== templateId) : [...prev, templateId]
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setError(null)

        const baseDate = defaultDate || new Date()

        // Construct ISO strings
        const [startH, startM] = startTime.split(':').map(Number)
        const [endH, endM] = endTime.split(':').map(Number)

        const start = new Date(baseDate)
        start.setHours(startH, startM, 0)

        const end = new Date(baseDate)
        end.setHours(endH, endM, 0)

        // Basic validation for overnight shifts (if end < start, add 1 day? Or just error?)
        // For simplicity, if end < start, assume next day
        if (end < start) {
            end.setDate(end.getDate() + 1)
        }

        const formData = new FormData()
        if (shift?.id) formData.append('id', shift.id)
        formData.append('staff_id', staffId)
        formData.append('start_time', start.toISOString())
        formData.append('end_time', end.toISOString())
        formData.append('role', role)
        formData.append('status', status)
        if (notes) formData.append('notes', notes)

        if (repeatWeekly) {
            const futureShifts = []
            // Generate for next 52 weeks (1 year)
            for (let i = 1; i <= 52; i++) {
                const nextStart = new Date(start)
                nextStart.setDate(start.getDate() + i * 7)

                const nextEnd = new Date(end)
                nextEnd.setDate(end.getDate() + i * 7)

                futureShifts.push({
                    start_time: nextStart.toISOString(),
                    end_time: nextEnd.toISOString(),
                })
            }
            formData.append('future_shifts', JSON.stringify(futureShifts))
        }

        try {
            const res = await saveShift({}, formData)
            if (res.error) {
                setError(res.error)
            } else if (res.shift) {
                // Handle checklist assignments for the saved shift
                const shiftId = res.shift.id

                // Get current assignments
                const currentAssignments = shift?.shift_checklists || []
                const currentTemplateIds = currentAssignments.map(sc => sc.template_id)

                // Find checklists to add and remove
                const toAdd = selectedChecklistIds.filter(id => !currentTemplateIds.includes(id))
                const toRemove = currentAssignments.filter(
                    sc => !selectedChecklistIds.includes(sc.template_id)
                )

                // Assign new checklists
                for (const templateId of toAdd) {
                    await assignChecklistToShift(shiftId, templateId)
                }

                // Remove unselected checklists
                for (const assignment of toRemove) {
                    await unassignChecklistFromShift(assignment.id)
                }

                if (onSave) onSave(res.shift)
                onOpenChange(false)
                router.refresh()
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
            setError(errorMessage)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!shift?.id) return
        if (!confirm('Schicht wirklich löschen?')) return

        setIsDeleting(true)
        try {
            const res = await deleteShift(shift.id)
            if (res.error) {
                setError(res.error)
            } else {
                if (onDelete) onDelete(shift.id)
                onOpenChange(false)
                router.refresh()
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
            setError(errorMessage)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={() => onOpenChange(false)}
            title={
                shift
                    ? 'Schicht bearbeiten'
                    : `Neue Schicht am ${defaultDate?.toLocaleDateString('de-DE')}`
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-destructive/15 text-destructive text-sm p-2 rounded">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Von</label>
                        <Input
                            type="time"
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Bis</label>
                        <Input
                            type="time"
                            value={endTime}
                            onChange={e => setEndTime(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Rolle / Bereich</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        value={role}
                        onChange={e => setRole(e.target.value)}
                    >
                        <option value="Bar">Bar</option>
                        <option value="Theke">Theke (Check-In)</option>
                        <option value="Service">Service</option>
                        <option value="Trainer">Trainer</option>
                        <option value="Routenbau">Routenbau</option>
                        <option value="Reinigung">Reinigung</option>
                        <option value="Büro">Büro / Admin</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Mitarbeiter</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        value={staffId}
                        onChange={e => setStaffId(e.target.value)}
                    >
                        <option value="open" className="text-orange-600 font-bold">
                            -- Offene Schicht --
                        </option>

                        {(() => {
                            // Filter logic
                            const qualifiedStaff = staffMembers.filter(s =>
                                s.staff_roles?.some((r: { role: string }) => r.role === role)
                            )
                            const otherStaff = staffMembers.filter(
                                s => !s.staff_roles?.some((r: { role: string }) => r.role === role)
                            )

                            return (
                                <>
                                    {qualifiedStaff.length > 0 && (
                                        <optgroup label="Qualifiziert">
                                            {qualifiedStaff.map(staff => (
                                                <option key={staff.id} value={staff.id}>
                                                    {staff.first_name} {staff.last_name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
                                    {otherStaff.length > 0 && (
                                        <optgroup label="Andere">
                                            {otherStaff.map(staff => (
                                                <option key={staff.id} value={staff.id}>
                                                    {staff.first_name} {staff.last_name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
                                </>
                            )
                        })()}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                    >
                        <option value="draft">Entwurf (Versteckt)</option>
                        <option value="published">Veröffentlicht (Sichtbar)</option>
                        <option value="cancelled">Abgesagt</option>
                    </select>
                </div>

                {/* Checklists Section */}
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        Checklisten
                    </label>
                    {loadingChecklists ? (
                        <div className="text-sm text-muted-foreground">Laden...</div>
                    ) : availableChecklists.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                            Keine aktiven Checklisten vorhanden
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                            {availableChecklists.map(checklist => (
                                <label
                                    key={checklist.id}
                                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
                                >
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                        checked={selectedChecklistIds.includes(checklist.id)}
                                        onChange={() => toggleChecklist(checklist.id)}
                                    />
                                    <span className="text-sm">{checklist.name}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Notizen</label>
                    <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Interne Notizen..."
                    />
                </div>

                {!shift && (
                    <div className="flex items-center space-x-2 pt-2">
                        <input
                            type="checkbox"
                            id="repeatWeekly"
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                            checked={repeatWeekly}
                            onChange={e => setRepeatWeekly(e.target.checked)}
                        />
                        <label
                            htmlFor="repeatWeekly"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Wöchentlich wiederholen (kopiert Schicht für 1 Jahr als Entwurf)
                        </label>
                    </div>
                )}

                <div className="flex justify-between pt-4">
                    {shift?.id ? (
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={isDeleting || isSaving}
                            onClick={handleDelete}
                        >
                            {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                        </Button>
                    ) : (
                        <div />
                    )}

                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Abbrechen
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Speichern
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    )
}
