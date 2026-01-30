'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================
// TYPES
// ============================================

export interface ChatChannel {
    id: string
    organization_id: string
    name: string
    description: string | null
    is_private: boolean
    created_by: string | null
    created_at: string
    updated_at: string
}

export interface ChatMessage {
    id: string
    channel_id: string
    user_id: string
    thread_parent_id: string | null
    content: string
    reply_count: number
    is_edited: boolean
    created_at: string
    updated_at: string
    user?: {
        id: string
        first_name: string | null
        last_name: string | null
        avatar_url: string | null
    }
    attachments?: ChatMessageAttachment[]
    reactions?: ChatMessageReaction[]
}

export interface ChatMessageAttachment {
    id: string
    message_id: string
    file_url: string
    file_type: string
    file_name: string
    file_size: number | null
    created_at: string
}

export interface ChatMessageReaction {
    id: string
    message_id: string
    user_id: string
    emoji: string
    created_at: string
}

export interface ChannelMember {
    id: string
    channel_id: string
    user_id: string
    joined_at: string
    last_read_at: string
    user?: {
        id: string
        first_name: string | null
        last_name: string | null
        avatar_url: string | null
        role: string
    }
}

// ============================================
// CHANNEL OPERATIONS
// ============================================

export async function getChannels(): Promise<ChatChannel[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('chat_channels')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching channels:', error)
        throw new Error('Failed to fetch channels')
    }

    return data || []
}

export async function getChannelById(channelId: string): Promise<ChatChannel | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('chat_channels')
        .select('*')
        .eq('id', channelId)
        .single()

    if (error) {
        console.error('Error fetching channel:', error)
        return null
    }

    return data
}

export async function createChannel(
    name: string,
    description?: string,
    isPrivate: boolean = false
): Promise<ChatChannel> {
    const supabase = await createClient()

    // Get current user
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
        throw new Error('Not authenticated')
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        throw new Error('Profile not found')
    }

    // Create channel
    const { data, error } = await supabase
        .from('chat_channels')
        .insert({
            organization_id: profile.organization_id,
            name: name.toLowerCase().replace(/\s+/g, '-'),
            description,
            is_private: isPrivate,
            created_by: user.id,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating channel:', error)
        throw new Error('Failed to create channel: ' + error.message)
    }

    // Auto-add creator as member
    await addChannelMember(data.id, user.id)

    revalidatePath('/staff/chat')
    revalidatePath('/admin/chat')

    return data
}

export async function updateChannel(
    channelId: string,
    updates: { name?: string; description?: string; is_private?: boolean }
): Promise<ChatChannel> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('chat_channels')
        .update({
            ...updates,
            name: updates.name?.toLowerCase().replace(/\s+/g, '-'),
        })
        .eq('id', channelId)
        .select()
        .single()

    if (error) {
        console.error('Error updating channel:', error)
        throw new Error('Failed to update channel')
    }

    revalidatePath('/staff/chat')
    revalidatePath('/admin/chat')

    return data
}

export async function deleteChannel(channelId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase.from('chat_channels').delete().eq('id', channelId)

    if (error) {
        console.error('Error deleting channel:', error)
        throw new Error('Failed to delete channel')
    }

    revalidatePath('/staff/chat')
    revalidatePath('/admin/chat')
}

// ============================================
// CHANNEL MEMBER OPERATIONS
// ============================================

export async function getChannelMembers(channelId: string): Promise<ChannelMember[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('chat_channel_members')
        .select(
            `
            *,
            user:profiles(id, first_name, last_name, avatar_url, role)
        `
        )
        .eq('channel_id', channelId)

    if (error) {
        console.error('Error fetching channel members:', error)
        throw new Error('Failed to fetch channel members')
    }

    return data || []
}

export async function addChannelMember(channelId: string, userId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase.from('chat_channel_members').upsert(
        {
            channel_id: channelId,
            user_id: userId,
        },
        { onConflict: 'channel_id,user_id' }
    )

    if (error) {
        console.error('Error adding channel member:', error)
        throw new Error('Failed to add channel member')
    }
}

export async function removeChannelMember(channelId: string, userId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('chat_channel_members')
        .delete()
        .eq('channel_id', channelId)
        .eq('user_id', userId)

    if (error) {
        console.error('Error removing channel member:', error)
        throw new Error('Failed to remove channel member')
    }
}

export async function updateLastRead(channelId: string): Promise<void> {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase
        .from('chat_channel_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('channel_id', channelId)
        .eq('user_id', user.id)
}

// ============================================
// MESSAGE OPERATIONS
// ============================================

export async function getMessages(
    channelId: string,
    limit: number = 50,
    before?: string
): Promise<ChatMessage[]> {
    const supabase = await createClient()

    let query = supabase
        .from('chat_messages')
        .select(
            `
            *,
            user:profiles(id, first_name, last_name, avatar_url),
            attachments:chat_message_attachments(*),
            reactions:chat_message_reactions(*)
        `
        )
        .eq('channel_id', channelId)
        .is('thread_parent_id', null)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (before) {
        query = query.lt('created_at', before)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching messages:', error)
        throw new Error('Failed to fetch messages')
    }

    // Return in chronological order (oldest first)
    return (data || []).reverse()
}

export async function getThreadMessages(parentMessageId: string): Promise<ChatMessage[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('chat_messages')
        .select(
            `
            *,
            user:profiles(id, first_name, last_name, avatar_url),
            attachments:chat_message_attachments(*),
            reactions:chat_message_reactions(*)
        `
        )
        .eq('thread_parent_id', parentMessageId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching thread messages:', error)
        throw new Error('Failed to fetch thread messages')
    }

    return data || []
}

export async function sendMessage(
    channelId: string,
    content: string,
    threadParentId?: string,
    attachments?: { file_url: string; file_type: string; file_name: string; file_size?: number }[]
): Promise<ChatMessage> {
    const supabase = await createClient()

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
        throw new Error('Not authenticated')
    }

    // Create message
    const { data: message, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
            channel_id: channelId,
            user_id: user.id,
            content,
            thread_parent_id: threadParentId || null,
        })
        .select(
            `
            *,
            user:profiles(id, first_name, last_name, avatar_url)
        `
        )
        .single()

    if (messageError) {
        console.error('Error sending message:', messageError)
        throw new Error('Failed to send message')
    }

    // Add attachments if any
    if (attachments && attachments.length > 0) {
        const attachmentData = attachments.map(att => ({
            message_id: message.id,
            file_url: att.file_url,
            file_type: att.file_type,
            file_name: att.file_name,
            file_size: att.file_size || null,
        }))

        const { error: attachmentError } = await supabase
            .from('chat_message_attachments')
            .insert(attachmentData)

        if (attachmentError) {
            console.error('Error adding attachments:', attachmentError)
        }
    }

    return message
}

export async function editMessage(messageId: string, content: string): Promise<ChatMessage> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('chat_messages')
        .update({
            content,
            is_edited: true,
            updated_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .select(
            `
            *,
            user:profiles(id, first_name, last_name, avatar_url)
        `
        )
        .single()

    if (error) {
        console.error('Error editing message:', error)
        throw new Error('Failed to edit message')
    }

    return data
}

export async function deleteMessage(messageId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase.from('chat_messages').delete().eq('id', messageId)

    if (error) {
        console.error('Error deleting message:', error)
        throw new Error('Failed to delete message')
    }
}

// ============================================
// REACTION OPERATIONS
// ============================================

export async function addReaction(messageId: string, emoji: string): Promise<void> {
    const supabase = await createClient()

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
        throw new Error('Not authenticated')
    }

    const { error } = await supabase.from('chat_message_reactions').upsert(
        {
            message_id: messageId,
            user_id: user.id,
            emoji,
        },
        { onConflict: 'message_id,user_id,emoji' }
    )

    if (error) {
        console.error('Error adding reaction:', error)
        throw new Error('Failed to add reaction')
    }
}

export async function removeReaction(messageId: string, emoji: string): Promise<void> {
    const supabase = await createClient()

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
        throw new Error('Not authenticated')
    }

    const { error } = await supabase
        .from('chat_message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)

    if (error) {
        console.error('Error removing reaction:', error)
        throw new Error('Failed to remove reaction')
    }
}

export async function getReactions(messageId: string): Promise<ChatMessageReaction[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('chat_message_reactions')
        .select('*')
        .eq('message_id', messageId)

    if (error) {
        console.error('Error fetching reactions:', error)
        throw new Error('Failed to fetch reactions')
    }

    return data || []
}

// ============================================
// ATTACHMENT UPLOAD
// ============================================

export async function uploadChatAttachment(
    formData: FormData
): Promise<{ url: string; fileName: string; fileType: string; fileSize: number }> {
    const supabase = await createClient()

    const file = formData.get('file') as File
    if (!file) {
        throw new Error('No file provided')
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
        throw new Error('Not authenticated')
    }

    // Get user's organization
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile) {
        throw new Error('Profile not found')
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${profile.organization_id}/${user.id}/${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
        })

    if (uploadError) {
        console.error('Error uploading file:', uploadError)
        throw new Error('Failed to upload file: ' + uploadError.message)
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(fileName)

    return {
        url: urlData.publicUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
    }
}

// ============================================
// UNREAD COUNT
// ============================================

export async function getUnreadCounts(): Promise<Record<string, number>> {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return {}

    // Get all channel memberships with last_read_at
    const { data: memberships, error: memberError } = await supabase
        .from('chat_channel_members')
        .select('channel_id, last_read_at')
        .eq('user_id', user.id)

    if (memberError || !memberships) return {}

    const counts: Record<string, number> = {}

    for (const membership of memberships) {
        const { count, error } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', membership.channel_id)
            .gt('created_at', membership.last_read_at)
            .neq('user_id', user.id)

        if (!error) {
            counts[membership.channel_id] = count || 0
        }
    }

    return counts
}
