import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { generateText, tool, embed, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

// Manually load .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8')
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=')
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '')
        }
    })
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase env vars')
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testMaxSteps() {
    console.log('\nTesting generateText with search_knowledge tool...')
    if (!process.env.OPENAI_API_KEY) {
        console.error('No OPENAI_API_KEY found in .env.local')
        return
    }

    try {
        const { text, steps } = await generateText({
            model: openai('gpt-4o'),
            system: 'You are a helper. Always use the search_knowledge tool to answer questions.',
            messages: [
                { role: 'user', content: 'Was steht in der Knowledge Base über "Öffnungszeiten"?' },
            ],
            stopWhen: stepCountIs(5),
            tools: {
                create_product: tool({
                    description: 'Erstellt ein neues Produkt im System.',
                    inputSchema: z.object({
                        name: z.string(),
                        type: z.enum(['day_pass', 'membership', 'punch_card']),
                        tax_rate: z.number().default(19.0),
                    }),
                    execute: async () => 'Product created',
                }),
                search_knowledge: tool({
                    description: 'Durchsucht die Knowledge Base nach Informationen.',
                    inputSchema: z.object({
                        query: z.string().describe('Suchbegriff oder Frage des Nutzers'),
                    }),
                    execute: async ({ query }) => {
                        console.log('Searching KB for:', query)

                        try {
                            const { embedding } = await embed({
                                model: openai.embedding('text-embedding-3-small'),
                                value: query,
                            })

                            // Call RPC
                            const { data, error } = await supabase.rpc('match_documents', {
                                query_embedding: embedding,
                                match_threshold: 0.5,
                                match_count: 5,
                                org_id: '00000000-0000-0000-0000-000000000001',
                            })

                            if (error) {
                                console.error('KB Search Error:', error)
                                return 'Fehler bei der Suche in der Datenbank.'
                            }

                            if (!data || data.length === 0) {
                                return 'Keine relevanten Einträge in der Knowledge Base gefunden.'
                            }

                            const context = data
                                .map((d: { content: string }) => d.content)
                                .join('\n\n---\n\n')
                            return `Gefundene Infos:\n${context}`
                        } catch (err) {
                            console.error('Embedding/Search Error:', err)
                            return 'Fehler beim Durchsuchen der Knowledge Base.'
                        }
                    },
                }),
            },
        })

        console.log('GenerateText Result:', text)
        console.log('Steps count:', steps?.length)
        if (steps) {
            console.log('Steps:', JSON.stringify(steps, null, 2))
        }
    } catch (e) {
        console.error('GenerateText Error:', e)
    }
}

async function main() {
    console.log("Checking 'document_chunks' table info...")

    // Hacky way to check columns via error message or select
    const { error: colError } = await supabase
        .from('document_chunks')
        .select('organization_id')
        .limit(1)

    if (colError) {
        console.error('Column Check Error:', colError.message)
        console.log("Likely 'organization_id' is MISSING in document_chunks.")
    } else {
        console.log("Column 'organization_id' exists.")
    }

    // Check count
    const { count, error: countError } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', '00000000-0000-0000-0000-000000000001')

    if (countError) {
        console.error('Count Error:', countError.message)
    } else {
        console.log(`Found ${count} chunks for default org.`)
    }

    console.log("\nTesting 'match_documents' RPC...")

    // Fake embedding (1536 dims)
    const fakeEmbedding = new Array(1536).fill(0.1)

    const { data: rpcData, error: rpcError } = await supabase.rpc('match_documents', {
        query_embedding: fakeEmbedding,
        match_threshold: 0.1,
        match_count: 1,
        org_id: '00000000-0000-0000-0000-000000000001',
    })

    if (rpcError) {
        console.error('RPC Error:', rpcError.message)
        console.error('Hint:', rpcError.hint)
        console.error('Details:', rpcError.details)
    } else {
        console.log('RPC Success. Data:', rpcData)
    }

    console.log('\nChecking last 5 chat messages...')
    const { data: messages, error: msgError } = await supabase
        .from('chalk_chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

    if (msgError) {
        console.error('Msg Fetch Error:', msgError.message)
    } else {
        console.log('Last 5 messages:')
        messages?.forEach(m => {
            console.log(
                `[${m.created_at}] ${m.sender_role}: '${m.content}' (Org: ${m.organization_id})`
            )
        })
    }

    await testMaxSteps()
}

main().catch(console.error)
