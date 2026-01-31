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
    content: string | Array<{ type: 'text'; text: string } | { type: 'image'; image: string }>
}

// Attachment type for images/files
export interface ChatAttachment {
    url: string
    type: string
    name: string
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

// Upload attachment to Supabase Storage
export async function uploadChatAttachment(formData: FormData): Promise<ChatAttachment | null> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const organizationId = await getOrganizationId()
    const file = formData.get('file') as File
    if (!file) throw new Error('No file provided')

    // Generate unique filename
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${organizationId}/${user.id}/${timestamp}_${safeName}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file, {
            contentType: file.type,
            upsert: false,
        })

    if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error('Failed to upload file')
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(filePath)

    return {
        url: urlData.publicUrl,
        type: file.type,
        name: file.name,
    }
}

export async function sendChalkMessage(content: string, imageUrls?: string[]) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const organizationId = await getOrganizationId()

    // Check Access
    const canAccessBot = await hasPermission(user.id, 'chalk_bot.access', organizationId)
    if (!canAccessBot) {
        throw new Error('Du hast keinen Zugriff auf den Chalk Bot.')
    }

    // Check permissions for capabilities
    const canManageContent = await hasPermission(
        user.id,
        'chalk_bot.manage_content',
        organizationId
    )
    const canManageEvents = await hasPermission(
        user.id,
        'chalk_bot.manage_staff_events',
        organizationId
    )
    const canManageChecklists = await hasPermission(
        user.id,
        'chalk_bot.manage_checklists',
        organizationId
    )

    // Build attachments array from imageUrls
    const attachments: ChatAttachment[] = imageUrls
        ? imageUrls.map(url => ({
              url,
              type: 'image',
              name: url.split('/').pop() || 'image',
          }))
        : []

    // 1. Save User Message
    await supabase.from('chalk_chat_messages').insert({
        user_id: user.id,
        content,
        sender_role: 'user',
        organization_id: organizationId,
        attachments: attachments.length > 0 ? attachments : [],
    })

    // 2. Fetch Context (Last 10 messages)
    const { data: history } = await supabase
        .from('chalk_chat_messages')
        .select('content, sender_role, attachments')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10)

    // Reverse to chronological order and build multimodal content
    let messages: ChatMessage[] = history
        ? history.reverse().map(m => {
              const msgAttachments = (m.attachments as ChatAttachment[]) || []
              const hasImages = msgAttachments.some(a => a.type.startsWith('image'))

              if (hasImages && m.sender_role === 'user') {
                  // Build multimodal content for user messages with images
                  const contentParts: Array<
                      { type: 'text'; text: string } | { type: 'image'; image: string }
                  > = [{ type: 'text', text: m.content }]
                  msgAttachments
                      .filter(a => a.type.startsWith('image'))
                      .forEach(a => {
                          contentParts.push({ type: 'image', image: a.url })
                      })
                  return {
                      role: 'user' as const,
                      content: contentParts,
                  }
              }

              return {
                  role: m.sender_role === 'user' ? 'user' : 'assistant',
                  content: m.content,
              } as ChatMessage
          })
        : []

    if (messages.length === 0) {
        if (imageUrls && imageUrls.length > 0) {
            const contentParts: Array<
                { type: 'text'; text: string } | { type: 'image'; image: string }
            > = [{ type: 'text', text: content }]
            imageUrls.forEach(url => {
                contentParts.push({ type: 'image', image: url })
            })
            messages = [{ role: 'user', content: contentParts }]
        } else {
            messages = [{ role: 'user', content }]
        }
    }

    // 4. Define Capabilities and Tools dynamically
    const capabilities = []
    const activeTools: Record<string, any> = {}

    // Capability: Knowledge Base (available to all with bot access)
    capabilities.push(`- Knowledge Base:
  Suche immer zuerst in der Knowledge Base nach der Antwort, nutze 'search_knowledge'.
  Wenn du die Antwort nicht findest, antworte allgemein.`)

    activeTools.search_knowledge = tool({
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

                const context = data.map((d: { content: string }) => d.content).join('\n\n---\n\n')
                return `Gefundene Infos:\n${context}`
            } catch (err) {
                console.error('Embedding/Search Error:', err)
                return 'Fehler beim Durchsuchen der Knowledge Base.'
            }
        },
    })

    // Capability: Vouchers (available to all with bot access)
    capabilities.push(`- Gutscheine:
  Du kannst den Status und Wert eines Gutscheins prüfen. Frage nach dem Code.`)

    activeTools.check_voucher = tool({
        description: 'Prüft den Status und Wert eines Gutscheins.',
        inputSchema: z.object({
            code: z.string().describe('Der Gutscheincode'),
        }),
        execute: async ({ code }) => {
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
    })

    // Capability: Staff Events
    if (canManageEvents) {
        capabilities.push(`- Personalwesen:
  Du kannst Abwesenheiten (Urlaub, Krankheit, Termine) eintragen.
  Kläre Start/Ende und Grund.`)

        activeTools.create_event = tool({
            description: 'Erstellt ein Abwesenheits-Ereignis im System',
            inputSchema: z.object({
                description: z.string(),
                start_time: z.string(),
                end_time: z.string(),
            }),
            execute: async ({ description, start_time, end_time }) => {
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
        })
    }

    // Capability: Manage Content (Products, Landing Pages)
    if (canManageContent) {
        capabilities.push(`- Produkte verwalten:
  Frage beim Anlegen nach Name, Preis, Typ (day_pass, membership, punch_card, addon, rental, merchandise, voucher). Standard-Steuer: 19.0.`)

        activeTools.create_product = tool({
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
        })

        capabilities.push(`- Landing Pages:
  Erstelle Landing Pages mit vollständigem, modernem HTML/CSS. Frage nach Titel, Slug und Inhalt.`)

        activeTools.create_landing_page = tool({
            description:
                'Erstellt eine neue Landing Page mit HTML-Inhalt. Generiert vollständiges, modernes HTML mit eingebetteten Styles.',
            inputSchema: z.object({
                title: z.string().describe('Titel der Landing Page'),
                slug: z.string().describe('URL-Slug (nur Kleinbuchstaben, Zahlen, Bindestriche)'),
                description: z
                    .string()
                    .describe('Beschreibung was auf der Seite zu sehen sein soll'),
            }),
            execute: async ({ title, slug, description }) => {
                const slugRegex = /^[a-z0-9-]+$/
                if (!slugRegex.test(slug)) {
                    return 'Der Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.'
                }

                const { text: htmlContent } = await generateText({
                    model: openai('gpt-4o'),
                    system: `Du bist ein Web-Designer. Erstelle vollständiges, modernes HTML für eine Landing Page.
WICHTIG:
- Generiere NUR valides HTML (kein Markdown)
- Nutze inline <style> Tags im <head> für CSS
- Modernes, ansprechendes Design
- Responsive Design
- Keine externen Abhängigkeiten`,
                    prompt: `Erstelle eine Landing Page mit dem Titel "${title}".
Inhalt/Beschreibung: ${description}
Generiere vollständiges, modernes HTML.`,
                })

                if (!htmlContent) return 'Fehler beim Generieren des HTML-Inhalts.'

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
                return `Landing Page "${title}" erfolgreich erstellt! (Vorschau: /landing-page/${slug})`
            },
        })
    }

    // Capability: Checklists
    if (canManageChecklists) {
        capabilities.push(`- Checklisten:
  Erstelle Checklisten-Vorlagen. Frage nach Name, Beschreibung und Items (checkbox, rating, text, multiselect).`)

        activeTools.create_checklist = tool({
            description: 'Erstellt eine neue Checkliste (Template) mit Aufgaben.',
            inputSchema: z.object({
                name: z.string().describe('Name der Checkliste'),
                description: z.string().optional().describe('Beschreibung wofür sie da ist'),
                items: z
                    .array(
                        z.object({
                            label: z.string().describe('Die Aufgabe selbst'),
                            type: z.enum(['checkbox', 'rating', 'text', 'multiselect']),
                            required: z.boolean().default(true),
                            options: z.array(z.string()).optional(),
                        })
                    )
                    .describe('Liste der Aufgaben'),
            }),
            execute: async ({ name, description, items }) => {
                const { data: template, error: tmplError } = await supabase
                    .from('checklist_templates')
                    .insert({
                        organization_id: organizationId,
                        name,
                        description: description || null,
                        is_active: true,
                    })
                    .select()
                    .single()

                if (tmplError) return `Fehler beim Erstellen der Vorlage: ${tmplError.message}`

                const itemsToInsert = items.map((item, index) => ({
                    template_id: template.id,
                    item_type: item.type,
                    label: item.label,
                    description: null,
                    options: item.options ? { options: item.options } : null,
                    sort_order: index,
                    required: item.required ?? true,
                }))

                const { error: itemsError } = await supabase
                    .from('checklist_items')
                    .insert(itemsToInsert)

                if (itemsError)
                    return `Vorlage erstellt, aber Fehler bei Items: ${itemsError.message}`

                revalidatePath('/admin/checklists')
                return `Checkliste '${name}' erfolgreich erstellt.`
            },
        })
    }

    // 5. Call AI
    try {
        const now = new Date()
        const dateContext = now.toLocaleString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })

        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set')
        }

        const systemPrompt = `Du bist Chalk, der KI-Assistent für 'Chalk'.
Aktuelle Zeit: ${dateContext}
Du sprichst Deutsch. Sei freundlich und effizient.

Du weißt genau, was du für diesen spezifischen Benutzer tun darfst.
Wenn der Benutzer fragt "Was kannst du tun?", "Was kannst du?" oder "Hilfe", liste freundlich NUR die unten stehenden Fähigkeiten auf.

Deine Fähigkeiten für diesen Benutzer:
${capabilities.join('\n\n')}

Antworte dem Nutzer immer bestätigend.`

        const { text, finishReason, steps } = await generateText({
            model: openai('gpt-4o'),
            system: systemPrompt,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            messages: messages as any,
            stopWhen: stepCountIs(5),
            tools: activeTools,
        })

        console.log(
            'AI Finished. Reason:',
            finishReason,
            'Steps:',
            steps?.length,
            'Text length:',
            text?.length
        )

        // 6. Save AI Response
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
