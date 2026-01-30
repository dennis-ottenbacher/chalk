'use client'

import { ChecklistTemplate } from '@/app/actions/checklists'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClipboardList, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { deleteChecklistTemplate } from '@/app/actions/checklists'
import { useState } from 'react'

interface ChecklistTemplateListProps {
    templates: ChecklistTemplate[]
}

export function ChecklistTemplateList({ templates }: ChecklistTemplateListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async (id: string) => {
        if (!confirm('Möchten Sie diese Checklist wirklich löschen?')) return

        setDeletingId(id)
        await deleteChecklistTemplate(id)
        setDeletingId(null)
    }

    if (templates.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Keine Checklisten vorhanden</h3>
                    <p className="text-muted-foreground text-center mt-2">
                        Erstellen Sie Ihre erste Checklist-Vorlage, um loszulegen.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map(template => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                                <ClipboardList className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">{template.name}</CardTitle>
                            </div>
                            <Badge variant={template.is_active ? 'default' : 'secondary'}>
                                {template.is_active ? 'Aktiv' : 'Inaktiv'}
                            </Badge>
                        </div>
                        {template.description && (
                            <CardDescription className="mt-2">
                                {template.description}
                            </CardDescription>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-muted-foreground">
                                Erstellt:{' '}
                                {new Date(template.created_at).toLocaleDateString('de-DE')}
                            </span>
                            <div className="flex gap-2">
                                <Link href={`/admin/checklists/${template.id}`}>
                                    <Button variant="outline" size="sm">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDelete(template.id)}
                                    disabled={deletingId === template.id}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
