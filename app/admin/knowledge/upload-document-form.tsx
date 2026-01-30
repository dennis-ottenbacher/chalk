'use client'

import { useState } from 'react'
import { ingestDocument } from '@/app/actions/knowledge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function UploadDocumentForm() {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setMessage(null)
        try {
            await ingestDocument(formData)
            setMessage({ type: 'success', text: 'Document processed successfully.' })

            // Reset form
            const form = document.getElementById('ingest-form') as HTMLFormElement
            if (form) form.reset()

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to upload' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <form id="ingest-form" action={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                    Title
                </label>
                <Input name="title" placeholder="e.g. Work Instructions" required />
            </div>

            <div>
                <label htmlFor="content" className="block text-sm font-medium mb-1">
                    Content (Text / Markdown)
                </label>
                <textarea
                    name="content"
                    className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Paste content here..."
                    required
                />
            </div>

            {message && (
                <p
                    className={`text-sm ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}
                >
                    {message.text}
                </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Processing & Embedding...' : 'Upload to Knowledge Base'}
            </Button>
        </form>
    )
}
