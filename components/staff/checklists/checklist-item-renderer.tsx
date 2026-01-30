'use client'

import { useState } from 'react'
import {
    ChecklistItem,
    ChecklistResponse,
    submitChecklistResponse,
    ResponseValue,
} from '@/app/actions/checklists'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Check, Star, CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChecklistItemRendererProps {
    shiftChecklistId: string
    item: ChecklistItem
    initialResponse: ChecklistResponse | undefined
}

export function ChecklistItemRenderer({
    shiftChecklistId,
    item,
    initialResponse,
}: ChecklistItemRendererProps) {
    const [response, setResponse] = useState<ResponseValue | null>(
        initialResponse?.response_value || null
    )
    const [saving, setSaving] = useState(false)

    const isComplete = (): boolean => {
        if (!response) return false
        if ('checked' in response) return response.checked === true
        if ('rating' in response) return response.rating > 0
        if ('text' in response) return response.text.trim().length > 0
        if ('selected' in response) return response.selected.trim().length > 0
        return false
    }

    const handleSubmit = async (value: ResponseValue) => {
        setSaving(true)
        setResponse(value)
        await submitChecklistResponse(shiftChecklistId, item.id, value)
        setSaving(false)
    }

    return (
        <Card
            className={cn(
                'transition-all',
                isComplete() ? 'border-green-200 bg-green-50/50' : 'border-gray-200'
            )}
        >
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    <div className="mt-1">
                        {isComplete() ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                    </div>
                    <div className="flex-1 space-y-3">
                        <div>
                            <div className="flex items-center gap-2">
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

                        {/* Render based on item type */}
                        <div className="mt-3">
                            {item.item_type === 'checkbox' && (
                                <CheckboxInput
                                    checked={
                                        response && 'checked' in response ? response.checked : false
                                    }
                                    onChange={checked => handleSubmit({ checked })}
                                    disabled={saving}
                                />
                            )}

                            {item.item_type === 'rating' && (
                                <RatingInput
                                    rating={response && 'rating' in response ? response.rating : 0}
                                    onChange={rating => handleSubmit({ rating })}
                                    disabled={saving}
                                />
                            )}

                            {item.item_type === 'text' && (
                                <TextInput
                                    text={response && 'text' in response ? response.text : ''}
                                    onSubmit={text => handleSubmit({ text })}
                                    disabled={saving}
                                />
                            )}

                            {item.item_type === 'multiselect' && (
                                <MultiselectInput
                                    selected={
                                        response && 'selected' in response ? response.selected : ''
                                    }
                                    options={item.options?.options || ['Ja', 'Nein']}
                                    onChange={selected => handleSubmit({ selected })}
                                    disabled={saving}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// Checkbox Input Component
function CheckboxInput({
    checked,
    onChange,
    disabled,
}: {
    checked: boolean
    onChange: (checked: boolean) => void
    disabled: boolean
}) {
    return (
        <Button
            variant={checked ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(!checked)}
            disabled={disabled}
            className="gap-2"
        >
            <Check className="h-4 w-4" />
            {checked ? 'Erledigt' : 'Als erledigt markieren'}
        </Button>
    )
}

// Rating Input Component (1-5 Stars)
function RatingInput({
    rating,
    onChange,
    disabled,
}: {
    rating: number
    onChange: (rating: number) => void
    disabled: boolean
}) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
                <button
                    key={star}
                    onClick={() => onChange(star)}
                    disabled={disabled}
                    className={cn(
                        'p-1 rounded transition-colors hover:bg-yellow-100',
                        disabled && 'opacity-50 cursor-not-allowed'
                    )}
                >
                    <Star
                        className={cn(
                            'h-8 w-8 transition-colors',
                            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        )}
                    />
                </button>
            ))}
        </div>
    )
}

// Text Input Component
function TextInput({
    text,
    onSubmit,
    disabled,
}: {
    text: string
    onSubmit: (text: string) => void
    disabled: boolean
}) {
    const [localText, setLocalText] = useState(text)

    const handleBlur = () => {
        if (localText !== text) {
            onSubmit(localText)
        }
    }

    return (
        <div className="flex gap-2">
            <Input
                value={localText}
                onChange={e => setLocalText(e.target.value)}
                onBlur={handleBlur}
                placeholder="Antwort eingeben..."
                disabled={disabled}
                className="max-w-md"
            />
            {localText !== text && (
                <Button size="sm" onClick={() => onSubmit(localText)} disabled={disabled}>
                    Speichern
                </Button>
            )}
        </div>
    )
}

// Multiselect Input Component (Yes/No Toggle like the screenshot)
function MultiselectInput({
    selected,
    options,
    onChange,
    disabled,
}: {
    selected: string
    options: string[]
    onChange: (selected: string) => void
    disabled: boolean
}) {
    return (
        <div className="inline-flex rounded-full border border-gray-300 overflow-hidden">
            {options.map(option => (
                <button
                    key={option}
                    onClick={() => onChange(option)}
                    disabled={disabled}
                    className={cn(
                        'px-6 py-2 text-sm font-medium transition-colors',
                        selected === option
                            ? 'bg-primary text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50',
                        disabled && 'opacity-50 cursor-not-allowed'
                    )}
                >
                    {option}
                </button>
            ))}
        </div>
    )
}
