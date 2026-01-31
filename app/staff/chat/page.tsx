'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    ChatSidebar,
    ChannelHeader,
    MessageList,
    MessageInput,
    ThreadPanel,
    CreateChannelModal,
} from '@/components/chat'
import { Card } from '@/components/ui/card'
import {
    getChannels,
    getMessages,
    getThreadMessages,
    sendMessage,
    deleteMessage,
    createChannel,
    addReaction,
    removeReaction,
    getUnreadCounts,
    updateLastRead,
    uploadChatAttachment,
    getChannelMembers,
    type ChatChannel,
    type ChatMessage,
} from '@/app/actions/chat'

export default function StaffChatPage() {
    const [channels, setChannels] = useState<ChatChannel[]>([])
    const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
    const [memberCount, setMemberCount] = useState(0)
    const [currentUserId, setCurrentUserId] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMessages, setIsLoadingMessages] = useState(false)

    // Thread state
    const [activeThread, setActiveThread] = useState<ChatMessage | null>(null)
    const [threadReplies, setThreadReplies] = useState<ChatMessage[]>([])
    const [isLoadingThread, setIsLoadingThread] = useState(false)

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    const supabase = createClient()

    // Initialize
    useEffect(() => {
        const init = async () => {
            try {
                // Get current user
                const {
                    data: { user },
                } = await supabase.auth.getUser()
                if (user) {
                    setCurrentUserId(user.id)
                }

                // Load channels
                const channelData = await getChannels()
                setChannels(channelData)

                // Load unread counts
                const counts = await getUnreadCounts()
                setUnreadCounts(counts)

                // Auto-select first channel
                if (channelData.length > 0) {
                    setActiveChannel(channelData[0])
                }
            } catch (error) {
                console.error('Failed to initialize chat:', error)
            } finally {
                setIsLoading(false)
            }
        }

        init()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Load messages when channel changes
    useEffect(() => {
        if (!activeChannel) return

        const loadMessages = async () => {
            setIsLoadingMessages(true)
            try {
                const messageData = await getMessages(activeChannel.id)
                setMessages(messageData)

                const members = await getChannelMembers(activeChannel.id)
                setMemberCount(members.length)

                // Mark as read
                await updateLastRead(activeChannel.id)
                setUnreadCounts(prev => ({ ...prev, [activeChannel.id]: 0 }))
            } catch (error) {
                console.error('Failed to load messages:', error)
            } finally {
                setIsLoadingMessages(false)
            }
        }

        loadMessages()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeChannel?.id])

    // Realtime subscription for messages
    useEffect(() => {
        if (!activeChannel) return

        const channel = supabase
            .channel(`chat-${activeChannel.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `channel_id=eq.${activeChannel.id}`,
                },
                async payload => {
                    // Fetch complete message with relations
                    const newMessage = payload.new as ChatMessage
                    if (newMessage.thread_parent_id) {
                        // It's a thread reply
                        if (activeThread && newMessage.thread_parent_id === activeThread.id) {
                            setThreadReplies(prev => [...prev, newMessage])
                        }
                    } else {
                        // Regular message - refetch to get user info
                        const msgs = await getMessages(activeChannel.id)
                        setMessages(msgs)
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'chat_messages',
                },
                payload => {
                    const deletedId = (payload.old as { id: string }).id
                    setMessages(prev => prev.filter(m => m.id !== deletedId))
                    setThreadReplies(prev => prev.filter(m => m.id !== deletedId))
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chat_message_reactions',
                },
                async () => {
                    // Refetch messages to get updated reactions
                    const msgs = await getMessages(activeChannel.id)
                    setMessages(msgs)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeChannel?.id, activeThread?.id])

    // Channel selection
    const handleChannelSelect = (channel: ChatChannel) => {
        setActiveChannel(channel)
        setActiveThread(null)
        setThreadReplies([])
    }

    // Send message
    const handleSendMessage = async (content: string, attachmentFiles?: File[]) => {
        if (!activeChannel) return

        let attachments
        if (attachmentFiles && attachmentFiles.length > 0) {
            attachments = await Promise.all(
                attachmentFiles.map(async file => {
                    const formData = new FormData()
                    formData.append('file', file)
                    const result = await uploadChatAttachment(formData)
                    return {
                        file_url: result.url,
                        file_type: result.fileType,
                        file_name: result.fileName,
                        file_size: result.fileSize,
                    }
                })
            )
        }

        await sendMessage(activeChannel.id, content, undefined, attachments)
    }

    // Thread
    const handleThreadClick = async (message: ChatMessage) => {
        setActiveThread(message)
        setIsLoadingThread(true)
        try {
            const replies = await getThreadMessages(message.id)
            setThreadReplies(replies)
        } catch (error) {
            console.error('Failed to load thread:', error)
        } finally {
            setIsLoadingThread(false)
        }
    }

    const handleSendThreadReply = async (content: string, attachmentFiles?: File[]) => {
        if (!activeChannel || !activeThread) return

        let attachments
        if (attachmentFiles && attachmentFiles.length > 0) {
            attachments = await Promise.all(
                attachmentFiles.map(async file => {
                    const formData = new FormData()
                    formData.append('file', file)
                    const result = await uploadChatAttachment(formData)
                    return {
                        file_url: result.url,
                        file_type: result.fileType,
                        file_name: result.fileName,
                        file_size: result.fileSize,
                    }
                })
            )
        }

        await sendMessage(activeChannel.id, content, activeThread.id, attachments)

        // Update reply count on parent message
        setMessages(prev =>
            prev.map(m => (m.id === activeThread.id ? { ...m, reply_count: m.reply_count + 1 } : m))
        )
    }

    // Reactions
    const handleReaction = async (messageId: string, emoji: string) => {
        await addReaction(messageId, emoji)
    }

    const handleRemoveReaction = async (messageId: string, emoji: string) => {
        await removeReaction(messageId, emoji)
    }

    // Delete message
    const handleDeleteMessage = async (messageId: string) => {
        if (!confirm('Nachricht wirklich löschen?')) return
        await deleteMessage(messageId)
    }

    // Create channel
    const handleCreateChannel = async (name: string, description: string, isPrivate: boolean) => {
        const newChannel = await createChannel(name, description, isPrivate)
        setChannels(prev => [...prev, newChannel].sort((a, b) => a.name.localeCompare(b.name)))
        setActiveChannel(newChannel)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full bg-background">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 border-3 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-muted-foreground">Lade Chat...</span>
                </div>
            </div>
        )
    }

    return (
        <Card className="flex flex-row h-[calc(100vh-5rem)] overflow-hidden border shadow-sm p-0 gap-0 m-8">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0 border-r bg-muted/10">
                <ChatSidebar
                    channels={channels}
                    activeChannelId={activeChannel?.id || null}
                    unreadCounts={unreadCounts}
                    onChannelSelect={handleChannelSelect}
                    onCreateChannel={() => setIsCreateModalOpen(true)}
                />
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-background relative">
                <ChannelHeader channel={activeChannel} memberCount={memberCount} />

                {activeChannel ? (
                    <>
                        <MessageList
                            messages={messages}
                            currentUserId={currentUserId}
                            onReaction={handleReaction}
                            onRemoveReaction={handleRemoveReaction}
                            onThreadClick={handleThreadClick}
                            onDeleteMessage={handleDeleteMessage}
                            isLoading={isLoadingMessages}
                        />

                        <MessageInput
                            onSend={handleSendMessage}
                            placeholder={`Nachricht an #${activeChannel.name}`}
                        />
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Wähle einen Channel aus, um zu chatten
                    </div>
                )}
            </div>

            {/* Thread Panel */}
            {activeThread && (
                <div className="w-80 border-l bg-background">
                    <ThreadPanel
                        parentMessage={activeThread}
                        replies={threadReplies}
                        currentUserId={currentUserId}
                        isLoading={isLoadingThread}
                        onClose={() => setActiveThread(null)}
                        onSendReply={handleSendThreadReply}
                        onReaction={handleReaction}
                        onRemoveReaction={handleRemoveReaction}
                    />
                </div>
            )}

            {/* Create Channel Modal */}
            <CreateChannelModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateChannel}
            />
        </Card>
    )
}
