'use client'

import { useState, useRef, useCallback } from 'react'
import { Send, Paperclip, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MessageInputProps {
    onSend: (content: string, attachments?: File[]) => Promise<void>
    placeholder?: string
    disabled?: boolean
    isThreadReply?: boolean
}

export function MessageInput({
    onSend,
    placeholder = 'Nachricht schreiben...',
    disabled = false,
    isThreadReply = false,
}: MessageInputProps) {
    const [content, setContent] = useState('')
    const [attachments, setAttachments] = useState<File[]>([])
    const [isSending, setIsSending] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = async () => {
        if ((!content.trim() && attachments.length === 0) || isSending) return

        setIsSending(true)
        try {
            await onSend(content.trim(), attachments.length > 0 ? attachments : undefined)
            setContent('')
            setAttachments([])
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
            }
        } catch (error) {
            console.error('Failed to send message:', error)
        } finally {
            setIsSending(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value)
        // Auto-resize textarea
        e.target.style.height = 'auto'
        e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
    }

    const handleFileSelect = (files: FileList | null) => {
        if (!files) return
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
        setAttachments(prev => [...prev, ...imageFiles])
    }

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index))
    }

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        handleFileSelect(e.dataTransfer.files)
    }, [])

    return (
        <div
            className={cn(
                'border-t border-gray-200 bg-white p-4',
                isThreadReply && 'border-t-0 pt-2'
            )}
        >
            {/* Attachment Previews */}
            {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {attachments.map((file, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeAttachment(index)}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div
                className={cn(
                    'flex items-end gap-2 rounded-lg border transition-colors',
                    isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50',
                    disabled && 'opacity-50 pointer-events-none'
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Attachment Button */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 flex-shrink-0 ml-1"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Paperclip className="h-5 w-5 text-gray-500" />
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => handleFileSelect(e.target.files)}
                />

                {/* Text Input */}
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled || isSending}
                    rows={1}
                    className="flex-1 bg-transparent border-0 resize-none py-2.5 text-sm focus:outline-none focus:ring-0 placeholder:text-gray-400"
                />

                {/* Send Button */}
                <Button
                    type="button"
                    size="sm"
                    className="h-10 w-10 p-0 flex-shrink-0 mr-1"
                    onClick={handleSubmit}
                    disabled={
                        disabled || isSending || (!content.trim() && attachments.length === 0)
                    }
                >
                    {isSending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                </Button>
            </div>

            {/* Drag & Drop Hint */}
            {isDragging && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 rounded-lg border-2 border-dashed border-blue-400">
                    <div className="flex flex-col items-center gap-2 text-blue-600">
                        <ImageIcon className="h-8 w-8" />
                        <span className="font-medium">Bild hierher ziehen</span>
                    </div>
                </div>
            )}
        </div>
    )
}
