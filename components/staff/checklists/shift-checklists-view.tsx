'use client'

import { ChecklistTemplate, ChecklistItem, ChecklistResponse } from '@/app/actions/checklists'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, CheckCircle2, Circle } from 'lucide-react'
import { ChecklistItemRenderer } from './checklist-item-renderer'

interface ShiftChecklistsViewProps {
    shiftId?: string
    checklists: Array<{
        id: string
        template: ChecklistTemplate
        items: ChecklistItem[]
        responses: ChecklistResponse[]
        progress: { completed: number; total: number }
    }>
}

export function ShiftChecklistsView({ shiftId, checklists }: ShiftChecklistsViewProps) {
    if (!shiftId) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Keine aktive Schicht</h3>
                    <p className="text-muted-foreground text-center mt-2">
                        Sie haben derzeit keine aktive Schicht mit zugewiesenen Checklisten.
                    </p>
                </CardContent>
            </Card>
        )
    }

    if (checklists.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <CheckCircle2 className="h-12 w-12 text-success mb-4" />
                    <h3 className="text-lg font-medium">Keine Checklisten</h3>
                    <p className="text-muted-foreground text-center mt-2">
                        Für diese Schicht sind keine Checklisten zugewiesen.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {checklists.map(checklist => {
                const isComplete = checklist.progress.completed === checklist.progress.total
                const progressPercent =
                    checklist.progress.total > 0
                        ? Math.round(
                              (checklist.progress.completed / checklist.progress.total) * 100
                          )
                        : 0

                return (
                    <Card key={checklist.id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {isComplete ? (
                                        <CheckCircle2 className="h-6 w-6 text-success" />
                                    ) : (
                                        <Circle className="h-6 w-6 text-muted-foreground" />
                                    )}
                                    <div>
                                        <CardTitle>{checklist.template.name}</CardTitle>
                                        {checklist.template.description && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {checklist.template.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <Badge variant={isComplete ? 'default' : 'secondary'}>
                                    {checklist.progress.completed} / {checklist.progress.total} (
                                    {progressPercent}%)
                                </Badge>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4 w-full bg-muted rounded-full h-2">
                                <div
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {checklist.items.map(item => {
                                const response = checklist.responses.find(
                                    r => r.item_id === item.id
                                )
                                return (
                                    <ChecklistItemRenderer
                                        key={item.id}
                                        shiftChecklistId={checklist.id}
                                        item={item}
                                        initialResponse={response}
                                    />
                                )
                            })}
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
