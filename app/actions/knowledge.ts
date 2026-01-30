'use server'

import { createClient } from '@/utils/supabase/server'
import { openai } from '@ai-sdk/openai'
import { embedMany } from 'ai'
import { revalidatePath } from 'next/cache'
import { getOrganizationId } from '@/lib/get-organization'

export async function getDocuments() {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching documents:', error)
        return []
    }
    return data
}

export async function deleteDocument(id: string) {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId)
    if (error) throw new Error(error.message)
    revalidatePath('/admin/knowledge')
}

export async function ingestDocument(formData: FormData) {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const title = formData.get('title') as string
    const content = formData.get('content') as string

    if (!title || !content) {
        throw new Error('Title and content are required')
    }

    // 1. Create Document Record
    const { data: doc, error: docError } = await supabase
        .from('documents')
        .insert({ title, content, organization_id: organizationId })
        .select()
        .single()

    if (docError) throw new Error(docError.message)

    try {
        // 2. Chunking
        const chunks = splitIntoChunks(content, 800)

        // 3. Generate Embeddings
        // Note: openai.embedding is the module, specific model is passed as string to 'model' property usually or direct usage
        const { embeddings } = await embedMany({
            model: openai.embedding('text-embedding-3-small'),
            values: chunks,
        })

        // 4. Store Chunks
        const chunkRows = chunks.map((chunk, i) => ({
            document_id: doc.id,
            content: chunk,
            embedding: embeddings[i],
            chunk_index: i,
            organization_id: organizationId,
        }))

        const { error: chunkError } = await supabase.from('document_chunks').insert(chunkRows)

        if (chunkError) {
            // If chunk storage fails, cleanup document
            await supabase.from('documents').delete().eq('id', doc.id)
            throw new Error(chunkError.message)
        }

        revalidatePath('/admin/knowledge')
        return { success: true }
    } catch (err: unknown) {
        console.error('Ingestion failed:', err)
        // Attempt cleanup
        await supabase.from('documents').delete().eq('id', doc.id)
        throw new Error(err instanceof Error ? err.message : 'Ingestion failed')
    }
}

// Simple chunking helper
function splitIntoChunks(text: string, maxChunkSize: number): string[] {
    const chunks: string[] = []

    // First split by paragraphs
    const paragraphs = text.split(/\n\s*\n/)

    for (const paragraph of paragraphs) {
        if (paragraph.trim().length === 0) continue

        if (paragraph.length <= maxChunkSize) {
            chunks.push(paragraph.trim())
        } else {
            // Split long paragraph by sentences
            const sentences = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [paragraph]
            let currentChunk = ''

            for (const sentence of sentences) {
                if ((currentChunk + sentence).length <= maxChunkSize) {
                    currentChunk += sentence
                } else {
                    if (currentChunk) chunks.push(currentChunk.trim())
                    currentChunk = sentence
                }
            }
            if (currentChunk) chunks.push(currentChunk.trim())
        }
    }

    return chunks
}
