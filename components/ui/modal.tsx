'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
    open: boolean
    onClose: () => void
    children: React.ReactNode
    title: string
    className?: string
}

export function Modal({ open, onClose, children, title, className }: ModalProps) {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className={cn(
                    'bg-background rounded-lg shadow-lg w-full max-w-md border animate-in zoom-in-95 duration-200',
                    className
                )}
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold text-lg">{title}</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>
    )
}
