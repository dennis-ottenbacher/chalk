import { getDocuments } from '@/app/actions/knowledge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { KnowledgeList } from './knowledge-list'
import { UploadDocumentForm } from './upload-document-form'

export default async function KnowledgePage() {
    const documents = await getDocuments()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Knowledge Base</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* List (Left on desktop) */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Documents</CardTitle>
                        <CardDescription>Manage the knowledge base content.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <KnowledgeList documents={documents} />
                    </CardContent>
                </Card>

                {/* Upload Form (Right on desktop) */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Add New Document</CardTitle>
                        <CardDescription>
                            Paste text or markdown content below. It will be chunked and vectorized
                            for the AI agent.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UploadDocumentForm />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
