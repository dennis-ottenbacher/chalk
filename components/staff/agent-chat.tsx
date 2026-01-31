'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
    getChalkMessages as getMessages,
    sendChalkMessage as sendMessage,
    uploadChatAttachment,
    type ChatAttachment,
} from '@/app/actions/chalk-agent'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Bot, Send, Paperclip, X, Loader2, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Message = {
    id: string
    content: string
    sender_role: 'user' | 'assistant'
    created_at: string
    attachments?: ChatAttachment[]
}

export function AgentChat({
    className,
    onMessageSent,
    hideHeader = false,
    initialPrompt,
    // New props for flexible agent usage
    getMessagesFn = getMessages,
    sendMessageFn = sendMessage,
}: {
    className?: string
    onMessageSent?: () => void
    hideHeader?: boolean
    initialPrompt?: string
    getMessagesFn?: () => Promise<Message[] | null>
    sendMessageFn?: (content: string, imageUrls?: string[]) => Promise<void>
}) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState(initialPrompt || '')
    const [loading, setLoading] = useState(false)
    const [pendingFiles, setPendingFiles] = useState<File[]>([])
    const [uploading, setUploading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const loadMessages = useCallback(async () => {
        const msgs = await getMessagesFn()
        setMessages(msgs || [])
    }, [getMessagesFn])

    useEffect(() => {
        loadMessages()
    }, [loadMessages])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        const imageFiles = files.filter(f => f.type.startsWith('image/'))
        setPendingFiles(prev => [...prev, ...imageFiles])
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const removePendingFile = (index: number) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleSend = async () => {
        if (!input.trim() && pendingFiles.length === 0) return

        setLoading(true)
        setUploading(pendingFiles.length > 0)

        try {
            // Upload pending files first
            const uploadedUrls: string[] = []
            for (const file of pendingFiles) {
                const formData = new FormData()
                formData.append('file', file)
                const attachment = await uploadChatAttachment(formData)
                if (attachment) {
                    uploadedUrls.push(attachment.url)
                }
            }

            setUploading(false)

            // Create optimistic message
            const tempId = Math.random().toString()
            const newMsg: Message = {
                id: tempId,
                content: input || '📷 Bild',
                sender_role: 'user',
                created_at: new Date().toISOString(),
                attachments: uploadedUrls.map(url => ({
                    url,
                    type: 'image',
                    name: 'image',
                })),
            }

            setMessages(prev => [...prev, newMsg])
            setInput('')
            setPendingFiles([])

            // Send message with image URLs
            await sendMessageFn(
                input || 'Was siehst du auf diesem Bild?',
                uploadedUrls.length > 0 ? uploadedUrls : undefined
            )
            await loadMessages()
            onMessageSent?.()
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
            setUploading(false)
        }
    }

    return (
        <Card className={cn('flex flex-col h-full', className)}>
            {!hideHeader && (
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Bot className="h-5 w-5 text-primary" />
                        Chalk Bot
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Frage nach Schichten oder Knowledge Base Infos.
                    </CardDescription>
                </CardHeader>
            )}
            <CardContent className="flex-1 flex flex-col overflow-hidden p-4 pt-0">
                <div className="flex-1 overflow-y-auto pr-2 space-y-4" ref={scrollRef}>
                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            className={cn(
                                'flex w-full',
                                msg.sender_role === 'user' ? 'justify-end' : 'justify-start'
                            )}
                        >
                            <div
                                className={cn(
                                    'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                                    msg.sender_role === 'user'
                                        ? 'bg-primary text-primary-foreground rounded-br-none'
                                        : 'bg-muted rounded-bl-none'
                                )}
                            >
                                {/* Display attached images */}
                                {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="mb-2 space-y-2">
                                        {msg.attachments
                                            .filter(a => a.type.startsWith('image'))
                                            .map((attachment, idx) => (
                                                <div
                                                    key={idx}
                                                    className="relative rounded-lg overflow-hidden"
                                                >
                                                    <Image
                                                        src={attachment.url}
                                                        alt={attachment.name || 'Attached image'}
                                                        width={300}
                                                        height={200}
                                                        className="max-w-full h-auto rounded-lg"
                                                        unoptimized
                                                    />
                                                </div>
                                            ))}
                                    </div>
                                )}
                                <div className="markdown-content">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({ children }) => (
                                                <p className="mb-2 last:mb-0 leading-relaxed">
                                                    {children}
                                                </p>
                                            ),
                                            ul: ({ children }) => (
                                                <ul className="list-disc ml-4 mb-2 space-y-1">
                                                    {children}
                                                </ul>
                                            ),
                                            ol: ({ children }) => (
                                                <ol className="list-decimal ml-4 mb-2 space-y-1">
                                                    {children}
                                                </ol>
                                            ),
                                            li: ({ children }) => <li>{children}</li>,
                                            h1: ({ children }) => (
                                                <h1 className="text-lg font-bold mb-2">
                                                    {children}
                                                </h1>
                                            ),
                                            h2: ({ children }) => (
                                                <h2 className="text-base font-bold mb-2">
                                                    {children}
                                                </h2>
                                            ),
                                            h3: ({ children }) => (
                                                <h3 className="text-sm font-bold mb-1">
                                                    {children}
                                                </h3>
                                            ),
                                            code: ({ className, children, ...props }) => {
                                                const isInline = !String(children).includes('\n')
                                                return isInline ? (
                                                    <code
                                                        className="bg-black/10 dark:bg-white/10 rounded px-1 py-0.5 font-mono text-xs"
                                                        {...props}
                                                    >
                                                        {children}
                                                    </code>
                                                ) : (
                                                    <pre className="bg-zinc-950 dark:bg-zinc-900 text-white p-2 rounded-md overflow-x-auto my-2 text-xs">
                                                        <code className={className} {...props}>
                                                            {children}
                                                        </code>
                                                    </pre>
                                                )
                                            },
                                            a: ({ children, href }) => (
                                                <a
                                                    href={href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="underline underline-offset-2 hover:opacity-80 font-medium"
                                                >
                                                    {children}
                                                </a>
                                            ),
                                            table: ({ children }) => (
                                                <div className="overflow-x-auto my-2">
                                                    <table className="w-full border-collapse border border-white/20 text-xs">
                                                        {children}
                                                    </table>
                                                </div>
                                            ),
                                            thead: ({ children }) => (
                                                <thead className="bg-black/10 dark:bg-white/10">
                                                    {children}
                                                </thead>
                                            ),
                                            th: ({ children }) => (
                                                <th className="border border-white/20 px-2 py-1 text-left font-bold">
                                                    {children}
                                                </th>
                                            ),
                                            td: ({ children }) => (
                                                <td className="border border-white/20 px-2 py-1">
                                                    {children}
                                                </td>
                                            ),
                                            blockquote: ({ children }) => (
                                                <blockquote className="border-l-2 border-white/40 pl-2 italic my-2">
                                                    {children}
                                                </blockquote>
                                            ),
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                                <span
                                    className={cn(
                                        'text-[10px] opacity-70 block mt-1',
                                        msg.sender_role === 'user'
                                            ? 'text-primary-foreground/70'
                                            : 'text-muted-foreground'
                                    )}
                                >
                                    {format(new Date(msg.created_at), 'HH:mm')}
                                </span>
                            </div>
                        </div>
                    ))}
                    {messages.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                            <p className="text-sm">Hi! Wie kann ich helfen?</p>
                        </div>
                    )}
                </div>

                {/* Pending files preview */}
                {pendingFiles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {pendingFiles.map((file, idx) => (
                            <div
                                key={idx}
                                className="relative group w-16 h-16 rounded-lg overflow-hidden border border-border"
                            >
                                <Image
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                                <button
                                    type="button"
                                    onClick={() => removePendingFile(idx)}
                                    className="absolute top-0 right-0 p-1 bg-destructive text-destructive-foreground rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-4 flex gap-2">
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {/* Attachment button */}
                    <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        title="Bild anhängen"
                    >
                        <Paperclip className="h-4 w-4" />
                    </Button>

                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                            const prompt = 'Was kannst du tun?'
                            setInput(prompt)
                            // Optional: auto-send
                            // sendMessageFn(prompt);
                            // loadMessages();
                        }}
                        disabled={loading}
                        title="Zeige Fähigkeiten"
                    >
                        <Sparkles className="h-4 w-4 text-amber-500" />
                    </Button>

                    <Input
                        className="flex-1 bg-background"
                        placeholder="Nachricht..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        disabled={loading}
                    />
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={loading || (!input.trim() && pendingFiles.length === 0)}
                    >
                        {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
