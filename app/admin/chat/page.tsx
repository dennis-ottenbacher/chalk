'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Trash2 } from 'lucide-react'
import {
    ChatSidebar,
    ChannelHeader,
    MessageList,
    MessageInput,
    ThreadPanel,
    CreateChannelModal,
} from '@/components/chat'
import { Button } from '@/components/ui/button'
import {
    getChannels,
    getMessages,
    getThreadMessages,
    sendMessage,
    deleteMessage,
    createChannel,
    deleteChannel,
    addReaction,
    removeReaction,
    getUnreadCounts,
    updateLastRead,
    uploadChatAttachment,
    getChannelMembers,
    type ChatChannel,
    type ChatMessage,
} from '@/app/actions/chat'

export default function AdminChatPage() {
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
    const [showChannelSettings, setShowChannelSettings] = useState(false)

    const supabase = createClient()

    // Initialize
    useEffect(() => {
        const init = async () => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser()
                if (user) {
                    setCurrentUserId(user.id)
                }

                const channelData = await getChannels()
                setChannels(channelData)

                const counts = await getUnreadCounts()
                setUnreadCounts(counts)

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

    // Realtime subscription
    useEffect(() => {
        if (!activeChannel) return

        const channel = supabase
            .channel(`admin-chat-${activeChannel.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `channel_id=eq.${activeChannel.id}`,
                },
                async payload => {
                    const newMessage = payload.new as ChatMessage
                    if (newMessage.thread_parent_id) {
                        if (activeThread && newMessage.thread_parent_id === activeThread.id) {
                            setThreadReplies(prev => [...prev, newMessage])
                        }
                    } else {
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

    const handleChannelSelect = (channel: ChatChannel) => {
        setActiveChannel(channel)
        setActiveThread(null)
        setThreadReplies([])
        setShowChannelSettings(false)
    }

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

        setMessages(prev =>
            prev.map(m => (m.id === activeThread.id ? { ...m, reply_count: m.reply_count + 1 } : m))
        )
    }

    const handleReaction = async (messageId: string, emoji: string) => {
        await addReaction(messageId, emoji)
    }

    const handleRemoveReaction = async (messageId: string, emoji: string) => {
        await removeReaction(messageId, emoji)
    }

    const handleDeleteMessage = async (messageId: string) => {
        if (!confirm('Nachricht wirklich löschen?')) return
        await deleteMessage(messageId)
    }

    const handleDeleteChannel = async () => {
        if (!activeChannel) return
        if (
            !confirm(
                `Channel #${activeChannel.name} wirklich löschen? Alle Nachrichten gehen verloren.`
            )
        )
            return

        await deleteChannel(activeChannel.id)
        setChannels(prev => prev.filter(c => c.id !== activeChannel.id))
        setActiveChannel(channels.find(c => c.id !== activeChannel.id) || null)
        setShowChannelSettings(false)
    }

    const handleCreateChannel = async (name: string, description: string, isPrivate: boolean) => {
        const newChannel = await createChannel(name, description, isPrivate)
        setChannels(prev => [...prev, newChannel].sort((a, b) => a.name.localeCompare(b.name)))
        setActiveChannel(newChannel)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                    <span className="text-gray-500">Lade Chat...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0">
                <ChatSidebar
                    channels={channels}
                    activeChannelId={activeChannel?.id || null}
                    unreadCounts={unreadCounts}
                    onChannelSelect={handleChannelSelect}
                    onCreateChannel={() => setIsCreateModalOpen(true)}
                    onChannelSettings={channel => {
                        setActiveChannel(channel)
                        setShowChannelSettings(true)
                    }}
                />
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                <ChannelHeader
                    channel={activeChannel}
                    memberCount={memberCount}
                    onShowSettings={() => setShowChannelSettings(true)}
                />

                {/* Channel Settings Panel */}
                {showChannelSettings && activeChannel && (
                    <div className="bg-yellow-50 border-b border-yellow-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-gray-900">Channel-Einstellungen</h3>
                                <p className="text-sm text-gray-500">
                                    Admin-Aktionen für #{activeChannel.name}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowChannelSettings(false)}
                                >
                                    Schließen
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDeleteChannel}
                                    className="gap-1"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Channel löschen
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

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
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        Wähle einen Channel aus, um zu chatten
                    </div>
                )}
            </div>

            {/* Thread Panel */}
            {activeThread && (
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
            )}

            {/* Create Channel Modal */}
            <CreateChannelModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateChannel}
            />
        </div>
    )
}
