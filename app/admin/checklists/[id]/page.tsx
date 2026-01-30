import { getChecklistTemplate } from '@/app/actions/checklists'
import { ChecklistTemplateEditor } from '@/components/admin/checklists/checklist-template-editor'
import { notFound } from 'next/navigation'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ChecklistTemplatePage({ params }: PageProps) {
    const { id } = await params

    // Handle "new" as a special case
    if (id === 'new') {
        return (
            <div className="flex flex-col h-full space-y-6 p-8">
                <ChecklistTemplateEditor template={null} items={[]} />
            </div>
        )
    }

    const { template, items } = await getChecklistTemplate(id)

    if (!template) {
        notFound()
    }

    return (
        <div className="flex flex-col h-full space-y-6 p-8">
            <ChecklistTemplateEditor template={template} items={items} />
        </div>
    )
}
