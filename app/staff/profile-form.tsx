'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'

// Define locally to handle potential missing types in the generated file
interface Profile {
    id: string
    first_name: string | null
    last_name: string | null
    address?: string | null
    city?: string | null
    zip_code?: string | null
    birth_date?: string | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any // Allow other properties
}

export function ProfileForm({ profile }: { profile: Profile }) {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        address: profile.address || '',
        city: profile.city || '',
        zip_code: profile.zip_code || '',
        birth_date: profile.birth_date || '',
    })
    const [message, setMessage] = useState<string | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        // Filter out empty strings to null if needed, or keep as string
        const updates = {
            first_name: formData.first_name,
            last_name: formData.last_name,
            address: formData.address,
            city: formData.city,
            zip_code: formData.zip_code,
            birth_date: formData.birth_date || null,
            updated_at: new Date().toISOString(),
        }

        try {
            const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id)

            if (error) throw error
            setMessage('Daten erfolgreich aktualisiert.')
            router.refresh()
        } catch (error) {
            console.error(error)
            setMessage('Fehler beim Speichern.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="first_name" className="text-sm font-medium">
                        Vorname
                    </label>
                    <Input
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="last_name" className="text-sm font-medium">
                        Nachname
                    </label>
                    <Input
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="birth_date" className="text-sm font-medium">
                    Geburtsdatum
                </label>
                <Input
                    id="birth_date"
                    name="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={handleChange}
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">
                    Adresse
                </label>
                <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="zip_code" className="text-sm font-medium">
                        PLZ
                    </label>
                    <Input
                        id="zip_code"
                        name="zip_code"
                        value={formData.zip_code}
                        onChange={handleChange}
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="city" className="text-sm font-medium">
                        Stadt
                    </label>
                    <Input id="city" name="city" value={formData.city} onChange={handleChange} />
                </div>
            </div>

            {message && (
                <div
                    className={`text-sm ${message.includes('Fehler') ? 'text-red-500' : 'text-green-500'}`}
                >
                    {message}
                </div>
            )}

            <Button type="submit" disabled={loading}>
                {loading ? 'Speichert...' : 'Speichern'}
            </Button>
        </form>
    )
}
