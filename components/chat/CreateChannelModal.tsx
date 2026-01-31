'use client'

import { useState } from 'react'
import { X, Hash, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface CreateChannelModalProps {
    isOpen: boolean
    onClose: () => void
    onCreate: (name: string, description: string, isPrivate: boolean) => Promise<void>
}

export function CreateChannelModal({ isOpen, onClose, onCreate }: CreateChannelModalProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [isPrivate, setIsPrivate] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState('')

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            setError('Bitte gib einen Channel-Namen ein')
            return
        }

        setIsCreating(true)
        setError('')

        try {
            await onCreate(name.trim(), description.trim(), isPrivate)
            setName('')
            setDescription('')
            setIsPrivate(false)
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Fehler beim Erstellen')
        } finally {
            setIsCreating(false)
        }
    }

    const handleClose = () => {
        setName('')
        setDescription('')
        setIsPrivate(false)
        setError('')
        onClose()
    }

    // Format name as slug
    const formattedName = name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

            {/* Modal */}
            <div className="relative bg-card rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden border border-border">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">
                        Neuen Channel erstellen
                    </h2>
                    <Button variant="ghost" size="sm" onClick={handleClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name Input */}
                    <div className="space-y-2">
                        <Label htmlFor="channel-name">Name</Label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                {isPrivate ? (
                                    <Lock className="h-4 w-4" />
                                ) : (
                                    <Hash className="h-4 w-4" />
                                )}
                            </div>
                            <Input
                                id="channel-name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="z.B. schichtplanung"
                                className="pl-9"
                                autoFocus
                            />
                        </div>
                        {formattedName && formattedName !== name.toLowerCase() && (
                            <p className="text-xs text-muted-foreground">
                                Wird zu: <span className="font-medium">#{formattedName}</span>
                            </p>
                        )}
                    </div>

                    {/* Description Input */}
                    <div className="space-y-2">
                        <Label htmlFor="channel-description">
                            Beschreibung <span className="text-muted-foreground">(optional)</span>
                        </Label>
                        <Input
                            id="channel-description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Worum geht es in diesem Channel?"
                        />
                    </div>

                    {/* Private Toggle */}
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <Label htmlFor="private-toggle" className="cursor-pointer">
                                Privater Channel
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Nur eingeladene Mitglieder können beitreten
                            </p>
                        </div>
                        <Switch
                            id="private-toggle"
                            checked={isPrivate}
                            onCheckedChange={setIsPrivate}
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                            {error}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isCreating}
                        >
                            Abbrechen
                        </Button>
                        <Button type="submit" disabled={!name.trim() || isCreating}>
                            {isCreating ? 'Erstelle...' : 'Erstellen'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
