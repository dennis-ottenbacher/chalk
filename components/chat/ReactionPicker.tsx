'use client'

import { useRef, useEffect } from 'react'

const COMMON_EMOJIS = ['👍', '👎', '❤️', '🎉', '😀', '😂', '🔥', '👀', '✅', '❌', '🤔', '💯']

interface ReactionPickerProps {
    onSelect: (emoji: string) => void
    onClose: () => void
}

export function ReactionPicker({ onSelect, onClose }: ReactionPickerProps) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [onClose])

    return (
        <div
            ref={ref}
            className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20"
        >
            <div className="grid grid-cols-6 gap-1">
                {COMMON_EMOJIS.map(emoji => (
                    <button
                        key={emoji}
                        className="h-8 w-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded transition-colors"
                        onClick={() => onSelect(emoji)}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    )
}
