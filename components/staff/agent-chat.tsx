'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
    getChalkMessages as getMessages,
    sendChalkMessage as sendMessage,
} from '@/app/actions/chalk-agent'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Bot, Send } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

type Message = {
    id: string
    content: string
    sender_role: 'user' | 'assistant'
    created_at: string
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
    sendMessageFn?: (content: string) => Promise<void>
}) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState(initialPrompt || '')
    const [loading, setLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

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

    const handleSend = async () => {
        if (!input.trim()) return
        const tempId = Math.random().toString()
        const newMsg: Message = {
            id: tempId,
            content: input,
            sender_role: 'user',
            created_at: new Date().toISOString(),
        }

        setMessages(prev => [...prev, newMsg])
        setInput('')
        setLoading(true)

        try {
            await sendMessageFn(newMsg.content)
            await loadMessages()
            onMessageSent?.()
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
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
                                <p>{msg.content}</p>
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
                <div className="mt-4 flex gap-2">
                    <Input
                        className="flex-1 bg-background"
                        placeholder="Nachricht..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                    />
                    <Button size="icon" onClick={handleSend} disabled={loading || !input.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
