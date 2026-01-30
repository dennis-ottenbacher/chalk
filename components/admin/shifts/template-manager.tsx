'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Trash2, Download, Save, X } from 'lucide-react'
import {
    getTemplates,
    deleteTemplate,
    loadTemplate,
    saveWeekAsTemplate,
} from '@/app/actions/shifts'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

type Template = {
    id: string
    name: string
    created_at: string
}

interface TemplateManagerProps {
    weekStart: Date
    weekEnd: Date
    onSuccess: () => void
}

export function TemplateManager({ weekStart, weekEnd, onSuccess }: TemplateManagerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [mode, setMode] = useState<'load' | 'save' | null>(null)
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(false)

    // Save Mode State
    const [newItemName, setNewItemName] = useState('')

    // Load Mode State
    // (templates are fetched)

    useEffect(() => {
        if (isOpen && mode === 'load') {
            fetchTemplates()
        }
    }, [isOpen, mode])

    async function fetchTemplates() {
        setLoading(true)
        const res = await getTemplates()
        setTemplates(res)
        setLoading(false)
    }

    async function handleSave() {
        if (!newItemName) return
        setLoading(true)
        try {
            const res = await saveWeekAsTemplate(
                weekStart.toISOString(),
                weekEnd.toISOString(),
                newItemName
            )
            if (res.error) {
                alert(res.error)
            } else {
                setIsOpen(false)
                setMode(null)
                setNewItemName('')
                onSuccess()
                alert('Vorlage gespeichert.')
            }
        } catch (e) {
            console.error(e)
            alert('Fehler beim Speichern')
        } finally {
            setLoading(false)
        }
    }

    async function handleLoad(templateId: string) {
        if (
            !confirm(
                'Dies wird neue Schichten als Entwurf in die aktuelle Woche importieren. Fortfahren?'
            )
        )
            return
        setLoading(true)
        try {
            const res = await loadTemplate(templateId, weekStart.toISOString())
            if (res.error) {
                alert(res.error)
            } else {
                setIsOpen(false)
                setMode(null)
                onSuccess()
                alert('Vorlage geladen.')
            }
        } catch (e) {
            console.error(e)
            alert('Fehler beim Laden')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Vorlage wirklich löschen?')) return
        // Optimistic update
        setTemplates(prev => prev.filter(t => t.id !== id))
        await deleteTemplate(id)
    }

    const openSave = () => {
        setMode('save')
        setIsOpen(true)
    }

    const openLoad = () => {
        setMode('load')
        setIsOpen(true)
    }

    const closeModal = () => {
        setIsOpen(false)
        setMode(null)
    }

    return (
        <>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={openSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Woche als Vorlage
                </Button>
                <Button variant="outline" size="sm" onClick={openLoad}>
                    <Download className="w-4 h-4 mr-2" />
                    Vorlage laden
                </Button>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-background rounded-lg shadow-lg border w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold">
                                {mode === 'save' ? 'Als Vorlage speichern' : 'Vorlage laden'}
                            </h3>
                            <Button variant="ghost" size="icon" onClick={closeModal}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="p-4">
                            <p className="text-sm text-muted-foreground mb-4">
                                {mode === 'save'
                                    ? 'Speichern Sie die aktuelle Woche als Vorlage, um sie später wiederzuverwenden.'
                                    : 'Wählen Sie eine Vorlage aus, um sie in die aktuelle Woche zu importieren.'}
                            </p>

                            {mode === 'save' && (
                                <div className="flex flex-col gap-4">
                                    <div className="grid gap-2">
                                        <label
                                            htmlFor="name"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Name der Vorlage
                                        </label>
                                        <Input
                                            id="name"
                                            value={newItemName}
                                            onChange={e => setNewItemName(e.target.value)}
                                            placeholder="z.B. Standardwoche A"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 mt-2">
                                        <Button variant="outline" onClick={closeModal}>
                                            Abbrechen
                                        </Button>
                                        <Button
                                            onClick={handleSave}
                                            disabled={loading || !newItemName}
                                        >
                                            {loading && (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            )}
                                            Speichern
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {mode === 'load' && (
                                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                                    {loading && templates.length === 0 ? (
                                        <div className="flex justify-center p-4">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        </div>
                                    ) : templates.length === 0 ? (
                                        <div className="text-center text-muted-foreground p-4">
                                            Keine Vorlagen gefunden.
                                        </div>
                                    ) : (
                                        templates.map(t => (
                                            <div
                                                key={t.id}
                                                className="flex items-center justify-between p-3 border rounded-md bg-card hover:bg-accent/50 transition-colors"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{t.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        Erstellt am{' '}
                                                        {format(
                                                            new Date(t.created_at),
                                                            'dd.MM.yyyy',
                                                            { locale: de }
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => handleLoad(t.id)}
                                                        disabled={loading}
                                                    >
                                                        Laden
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDelete(t.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
