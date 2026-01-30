'use client'

import { deleteDocument } from '@/app/actions/knowledge'
import { Button } from '@/components/ui/button'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'

type Document = {
    id: string
    title: string
    content: string | null
    created_at: string
}

export function KnowledgeList({ documents }: { documents: Document[] }) {
    if (!documents || documents.length === 0) {
        return <p className="text-muted-foreground text-sm">No documents found.</p>
    }

    return (
        <Accordion type="single" collapsible className="w-full">
            {documents.map(doc => (
                <AccordionItem key={doc.id} value={doc.id}>
                    <AccordionTrigger className="hover:no-underline px-1">
                        <div className="flex flex-col items-start gap-1">
                            <span className="text-sm font-semibold text-left">{doc.title}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-1">
                        <div className="space-y-4 pt-2">
                            <div className="text-sm text-foreground/90 whitespace-pre-wrap bg-muted/50 p-4 rounded-md border text-left">
                                {doc.content || 'No content available.'}
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <p className="text-xs text-muted-foreground">
                                    Added: {new Date(doc.created_at).toLocaleDateString()}
                                </p>
                                <form action={async () => await deleteDocument(doc.id)}>
                                    <Button variant="destructive" size="sm" type="submit">
                                        Delete Document
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    )
}
