import { Suspense } from 'react'
import { getChecklistTemplates } from '@/app/actions/checklists'
import { ChecklistTemplateList } from '@/components/admin/checklists/checklist-template-list'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function ChecklistsPage() {
    const templates = await getChecklistTemplates()

    return (
        <div className="flex flex-col h-full space-y-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Checklisten</h2>
                    <p className="text-muted-foreground">
                        Checklisten-Vorlagen erstellen und verwalten
                    </p>
                </div>
                <Link href="/admin/checklists/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Neue Checklist
                    </Button>
                </Link>
            </div>

            <Suspense fallback={<div>Laden...</div>}>
                <ChecklistTemplateList templates={templates} />
            </Suspense>
        </div>
    )
}
