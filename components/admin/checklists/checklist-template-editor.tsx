'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    ChecklistTemplate,
    ChecklistItem,
    createChecklistTemplate,
    updateChecklistTemplate,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    ChecklistItemType,
} from '@/app/actions/checklists'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    GripVertical,
    Check,
    Star,
    Type,
    ToggleLeft,
    Info,
} from 'lucide-react'
import Link from 'next/link'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface ChecklistTemplateEditorProps {
    template: ChecklistTemplate | null
    items: ChecklistItem[]
}

const itemTypeLabels: Record<ChecklistItemType, { label: string; icon: React.ReactNode }> = {
    checkbox: { label: 'Checkbox', icon: <Check className="h-4 w-4" /> },
    rating: { label: 'Bewertung (1-5 Sterne)', icon: <Star className="h-4 w-4" /> },
    text: { label: 'Freitext', icon: <Type className="h-4 w-4" /> },
    multiselect: { label: 'Ja/Nein Auswahl', icon: <ToggleLeft className="h-4 w-4" /> },
}

export function ChecklistTemplateEditor({ template, items }: ChecklistTemplateEditorProps) {
    const router = useRouter()
    const isNew = template === null

    const [name, setName] = useState(template?.name || '')
    const [description, setDescription] = useState(template?.description || '')
    const [isActive, setIsActive] = useState(template?.is_active ?? true)
    const [saving, setSaving] = useState(false)
    const [localItems, setLocalItems] = useState<ChecklistItem[]>(items)

    // New item form state
    const [showNewItemForm, setShowNewItemForm] = useState(false)
    const [newItemType, setNewItemType] = useState<ChecklistItemType>('checkbox')
    const [newItemLabel, setNewItemLabel] = useState('')
    const [newItemDescription, setNewItemDescription] = useState('')
    const [addingItem, setAddingItem] = useState(false)

    const handleSaveTemplate = async () => {
        if (!name.trim()) return

        setSaving(true)

        if (isNew) {
            const result = await createChecklistTemplate({ name, description })
            if (result.success && result.id) {
                router.push(`/admin/checklists/${result.id}`)
            }
        } else {
            await updateChecklistTemplate(template.id, {
                name,
                description,
                is_active: isActive,
            })
        }

        setSaving(false)
    }

    const handleAddItem = async () => {
        if (!newItemLabel.trim() || !template) return

        setAddingItem(true)

        const itemData: {
            item_type: ChecklistItemType
            label: string
            description?: string
            options?: { options: string[] }
        } = {
            item_type: newItemType,
            label: newItemLabel,
            description: newItemDescription || undefined,
        }

        // Add default options for multiselect
        if (newItemType === 'multiselect') {
            itemData.options = { options: ['Ja', 'Nein'] }
        }

        const result = await addChecklistItem(template.id, itemData)

        if (result.success && result.id) {
            setLocalItems([
                ...localItems,
                {
                    id: result.id,
                    template_id: template.id,
                    item_type: newItemType,
                    label: newItemLabel,
                    description: newItemDescription || null,
                    options: itemData.options || null,
                    sort_order: localItems.length,
                    required: true,
                    created_at: new Date().toISOString(),
                },
            ])
            setNewItemLabel('')
            setNewItemDescription('')
            setShowNewItemForm(false)
        }

        setAddingItem(false)
    }

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm('Möchten Sie dieses Element wirklich löschen?')) return

        await deleteChecklistItem(itemId)
        setLocalItems(localItems.filter(i => i.id !== itemId))
    }

    const handleToggleRequired = async (item: ChecklistItem) => {
        await updateChecklistItem(item.id, { required: !item.required })
        setLocalItems(localItems.map(i => (i.id === item.id ? { ...i, required: !i.required } : i)))
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/checklists">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">
                            {isNew ? 'Neue Checklist' : template?.name}
                        </h2>
                        <p className="text-muted-foreground">
                            {isNew
                                ? 'Erstellen Sie eine neue Checklisten-Vorlage'
                                : 'Bearbeiten Sie die Checklisten-Vorlage'}
                        </p>
                    </div>
                </div>
                <Button onClick={handleSaveTemplate} disabled={saving || !name.trim()}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Speichern...' : 'Speichern'}
                </Button>
            </div>

            {/* Template Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Vorlagen-Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="z.B. Schließ-Checklist"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Beschreibung (optional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Beschreibung der Checklist..."
                            rows={3}
                        />
                    </div>

                    {isNew && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                            <Info className="h-4 w-4" />
                            <span>
                                Hinweis: Felder können erst nach dem Speichern der Checkliste
                                hinzugefügt werden.
                            </span>
                        </div>
                    )}
                    {!isNew && (
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="active">Aktiv</Label>
                                <p className="text-sm text-muted-foreground">
                                    Inaktive Checklisten können nicht zugewiesen werden
                                </p>
                            </div>
                            <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Items List - Only show for existing templates */}
            {!isNew && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Elemente</CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowNewItemForm(!showNewItemForm)}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Element hinzufügen
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* New Item Form */}
                        {showNewItemForm && (
                            <Card className="border-dashed border-primary/50">
                                <CardContent className="pt-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Typ</Label>
                                            <Select
                                                value={newItemType}
                                                onValueChange={v =>
                                                    setNewItemType(v as ChecklistItemType)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(
                                                        Object.keys(
                                                            itemTypeLabels
                                                        ) as ChecklistItemType[]
                                                    ).map(type => (
                                                        <SelectItem key={type} value={type}>
                                                            <div className="flex items-center gap-2">
                                                                {itemTypeLabels[type].icon}
                                                                {itemTypeLabels[type].label}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Bezeichnung</Label>
                                            <Input
                                                value={newItemLabel}
                                                onChange={e => setNewItemLabel(e.target.value)}
                                                placeholder="z.B. Wurde die Theke gereinigt?"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Beschreibung (optional)</Label>
                                        <Input
                                            value={newItemDescription}
                                            onChange={e => setNewItemDescription(e.target.value)}
                                            placeholder="Zusätzliche Hinweise..."
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setShowNewItemForm(false)}
                                        >
                                            Abbrechen
                                        </Button>
                                        <Button
                                            onClick={handleAddItem}
                                            disabled={addingItem || !newItemLabel.trim()}
                                        >
                                            {addingItem ? 'Hinzufügen...' : 'Hinzufügen'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Items List */}
                        {localItems.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">
                                Noch keine Elemente. Fügen Sie Ihr erstes Element hinzu.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {localItems.map(item => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                {itemTypeLabels[item.item_type].icon}
                                                <span className="font-medium">{item.label}</span>
                                                {!item.required && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Optional
                                                    </Badge>
                                                )}
                                            </div>
                                            {item.description && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                        <Badge variant="secondary">
                                            {itemTypeLabels[item.item_type].label}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggleRequired(item)}
                                        >
                                            {item.required ? 'Optional machen' : 'Pflicht machen'}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => handleDeleteItem(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
