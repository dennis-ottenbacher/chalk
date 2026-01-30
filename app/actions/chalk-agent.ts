'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateText, tool, embed, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'
import { getOrganizationId } from '@/lib/get-organization'
import { z } from 'zod'
import { hasPermission } from '@/lib/permissions'

// Define the message interface based on what the DB returns and what AI SDK expects
interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

export async function getChalkMessages() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const organizationId = await getOrganizationId()

    // Fetch last 50 messages for context
    const { data, error } = await supabase
        .from('chalk_chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true })
        .limit(50)

    if (error) {
        console.error('Error fetching messages:', error)
        return []
    }
    return data
}

export async function getEvents() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const organizationId = await getOrganizationId()

    const { data, error } = await supabase
        .from('staff_events')
        .select('*')
        .eq('staff_id', user.id)
        .eq('organization_id', organizationId)
        .order('start_time', { ascending: true })

    if (error) {
        console.error('Error fetching events:', error)
        return []
    }
    return data
}

export async function deleteEvent(id: string) {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { error } = await supabase
        .from('staff_events')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId)

    if (error) throw error
    revalidatePath('/staff/agent')
}

export async function sendChalkMessage(content: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const organizationId = await getOrganizationId()

    // Check Access
    const hasAccess = await hasPermission(user.id, 'chalk_bot.access', organizationId)
    if (!hasAccess) {
        throw new Error('Du hast keinen Zugriff auf den Chalk Bot.')
    }

    // 1. Save User Message
    await supabase.from('chalk_chat_messages').insert({
        user_id: user.id,
        content,
        sender_role: 'user',
        organization_id: organizationId,
    })

    // 2. Fetch Context (Last 10 messages)
    const { data: history } = await supabase
        .from('chalk_chat_messages')
        .select('content, sender_role')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10)

    // Reverse to chronological order
    const messages: ChatMessage[] = history
        ? history.reverse().map(m => ({
              role: m.sender_role === 'user' ? 'user' : 'assistant',
              content: m.content,
          }))
        : []

    // 3. Call AI
    try {
        const now = new Date()
        // localized date string for the AI
        const dateContext = now.toLocaleString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })

        // Check for API Key
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set')
        }

        const { text, finishReason, steps } = await generateText({
            model: openai('gpt-4o'),
            system: `Du bist Chalk, der KI-Assistent für 'Chalk'.
            
Aktuelle Zeit: ${dateContext}

Du sprichst Deutsch. Sei freundlich und effizient.

Deine Fähigkeiten hängen von den Rechten des Users ab. Versuche immer zu helfen.

1. Produkte verwalten (für Admins)
- Wenn du ein Produkt anlegst, frage nach den nötigen Daten (Name, Preis, Typ, etc.) wenn sie fehlen.
- Typen: 'day_pass', 'membership', 'punch_card', 'addon', 'rental', 'merchandise', 'voucher'.
- Standard-Steuersatz ist 19.0.

2. Personalwesen (für Staff/Admins)
- Du kannst Abwesenheiten (Urlaub, Krankheit, Termine) eintragen.
- Kläre Start/Ende und Grund.

3. Knowledge Base (alle berechtigten)
- Suche immer zuerst in der Knowledge Base nach der Antwort, nutze 'search_knowledge'.
- Wenn du die Antwort nicht in der Knowledge Base findest, antworte dem Nutzer, mit einer allgemeinen wissenden Antwort.

4. Gutscheine (für alle)
- Du kannst den Status und Wert eines Gutscheins prüfen.
- Frage nach dem Code.

5. Landing Pages (für Admins)
- Du kannst Landing Pages erstellen mit vollständigem HTML.
- Frage nach: Titel, URL-Slug, Beschreibung des Inhalts.
- Der Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.
- Generiere modernes, ansprechendes HTML mit eingebetteten Styles.

Antworte dem Nutzer immer bestätigend.`,
            messages,
            stopWhen: stepCountIs(5),
            tools: {
                // STAFF TOOL: Create Event
                create_event: tool({
                    description: 'Erstellt ein Abwesenheits-Ereignis im System',
                    inputSchema: z.object({
                        description: z.string(),
                        start_time: z.string(),
                        end_time: z.string(),
                    }),
                    execute: async ({ description, start_time, end_time }) => {
                        const permitted = await hasPermission(
                            user.id,
                            'chalk_bot.manage_staff_events',
                            organizationId
                        )
                        if (!permitted)
                            return 'Du hast keine Berechtigung, Abwesenheiten einzutragen.'

                        const { error } = await supabase.from('staff_events').insert({
                            staff_id: user.id,
                            event_description: description,
                            start_time,
                            end_time,
                            organization_id: organizationId,
                        })
                        if (error) throw new Error(error.message)
                        return 'Abwesenheit erfolgreich gespeichert.'
                    },
                }),

                // ADMIN TOOL: Create Product
                create_product: tool({
                    description: 'Erstellt ein neues Produkt im System.',
                    inputSchema: z.object({
                        name: z.string(),
                        description: z.string().optional(),
                        price: z.number(),
                        type: z.enum([
                            'day_pass',
                            'membership',
                            'punch_card',
                            'addon',
                            'rental',
                            'merchandise',
                            'voucher',
                        ]),
                        tax_rate: z.number().default(19.0),
                    }),
                    execute: async ({ name, description, price, type, tax_rate }) => {
                        const permitted = await hasPermission(
                            user.id,
                            'chalk_bot.manage_content',
                            organizationId
                        )
                        if (!permitted) return 'Keine Berechtigung, Produkte anzulegen.'

                        const { error } = await supabase.from('products').insert({
                            name,
                            description: description || '',
                            price,
                            type,
                            tax_rate,
                            active: true,
                            organization_id: organizationId,
                        })
                        if (error) throw new Error(error.message)
                        return `Produkt '${name}' erfolgreich erstellt.`
                    },
                }),
                check_voucher: tool({
                    description: 'Prüft den Status und Wert eines Gutscheins.',
                    inputSchema: z.object({
                        code: z.string().describe('Der Gutscheincode'),
                    }),
                    execute: async ({ code }) => {
                        const permitted = await hasPermission(
                            user.id,
                            'chalk_bot.access',
                            organizationId
                        )
                        if (!permitted) return 'Keine Berechtigung.'

                        const { data: voucher, error } = await supabase
                            .from('vouchers')
                            .select('*')
                            .eq('code', code)
                            .eq('organization_id', organizationId)
                            .single()

                        if (error || !voucher) return 'Gutschein nicht gefunden.'

                        return `Gutschein ${code}:
Status: ${voucher.status}
Restwert: ${voucher.remaining_amount}€
Ursprungswert: ${voucher.initial_amount}€
Erstellt am: ${new Date(voucher.created_at).toLocaleDateString('de-DE')}
${voucher.expires_at ? `Läuft ab am: ${new Date(voucher.expires_at).toLocaleDateString('de-DE')}` : 'Kein Ablaufdatum'}`
                    },
                }),
                search_knowledge: tool({
                    description: 'Durchsucht die Knowledge Base nach Informationen.',
                    inputSchema: z.object({
                        query: z.string().describe('Suchbegriff oder Frage des Nutzers'),
                    }),
                    execute: async ({ query }) => {
                        console.log('Searching KB for:', query)
                        // Use basic access permission for reading KB for now, or check specific one if needed
                        const permitted = await hasPermission(
                            user.id,
                            'chalk_bot.access',
                            organizationId
                        )
                        if (!permitted)
                            return 'Du hast keine Berechtigung, die Knowledge Base zu lesen.'

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
                                org_id: organizationId,
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
                create_landing_page: tool({
                    description:
                        'Erstellt eine neue Landing Page mit HTML-Inhalt. Generiert vollständiges, modernes HTML mit eingebetteten Styles.',
                    inputSchema: z.object({
                        title: z.string().describe('Titel der Landing Page'),
                        slug: z
                            .string()
                            .describe('URL-Slug (nur Kleinbuchstaben, Zahlen, Bindestriche)'),
                        description: z
                            .string()
                            .describe('Beschreibung was auf der Seite zu sehen sein soll'),
                    }),
                    execute: async ({ title, slug, description }) => {
                        const permitted = await hasPermission(
                            user.id,
                            'chalk_bot.manage_content',
                            organizationId
                        )
                        if (!permitted) return 'Keine Berechtigung, Landing Pages zu erstellen.'

                        // Validate slug format
                        const slugRegex = /^[a-z0-9-]+$/
                        if (!slugRegex.test(slug)) {
                            return 'Der Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.'
                        }

                        // Generate HTML content using AI
                        const { text: htmlContent } = await generateText({
                            model: openai('gpt-4o'),
                            system: `Du bist ein Web-Designer. Erstelle vollständiges, modernes HTML für eine Landing Page.

WICHTIG:
- Generiere NUR valides HTML (kein Markdown)
- Nutze inline <style> Tags im <head> für CSS
- Modernes, ansprechendes Design mit Gradients, Schatten, etc.
- Responsive Design
- Keine externen Abhängigkeiten
- Nutze professionelle Farben und Typografie
- Struktur: Hero-Section, Features, Call-to-Action

Das HTML muss vollständig sein mit <!DOCTYPE html>, <html>, <head>, <body>.`,
                            prompt: `Erstelle eine Landing Page mit dem Titel "${title}".

Inhalt/Beschreibung: ${description}

Generiere vollständiges, modernes HTML.`,
                        })

                        if (!htmlContent) {
                            return 'Fehler beim Generieren des HTML-Inhalts.'
                        }

                        // Save to database
                        const { error } = await supabase.from('landing_pages').insert({
                            organization_id: organizationId,
                            title,
                            slug,
                            html_content: htmlContent,
                            is_published: false,
                            created_by: user.id,
                        })

                        if (error) {
                            console.error('Error creating landing page:', error)
                            if (error.code === '23505') {
                                return `Eine Seite mit dem Slug '${slug}' existiert bereits.`
                            }
                            return `Fehler beim Speichern: ${error.message}`
                        }

                        revalidatePath('/admin/landing-pages')
                        return `Landing Page "${title}" erfolgreich erstellt! 🎉

Du findest sie unter: /admin/landing-pages
Vorschau: /landing-page/${slug}

Die Seite ist als Entwurf gespeichert. Veröffentliche sie im Admin-Bereich.`
                    },
                }),
            },
        })

        console.log(
            'AI Finished. Reason:',
            finishReason,
            'Steps:',
            steps?.length,
            'Text length:',
            text?.length
        )

        // 4. Save AI Response
        const assistantText =
            text || `Ich bin sprachlos. (Debug: reason=${finishReason}, steps=${steps?.length})`

        await supabase.from('chalk_chat_messages').insert({
            user_id: user.id,
            content: assistantText,
            sender_role: 'assistant',
            organization_id: organizationId,
        })
    } catch (err: unknown) {
        console.error('AI Error:', err)
        // Fallback response
        await supabase.from('chalk_chat_messages').insert({
            user_id: user.id,
            content: `Sorry, mein Gehirn (OpenAI) antwortet gerade nicht. Error: ${err}`,
            sender_role: 'assistant',
            organization_id: organizationId,
        })
    }

    revalidatePath('/admin/agent')
    revalidatePath('/staff/agent')
}
