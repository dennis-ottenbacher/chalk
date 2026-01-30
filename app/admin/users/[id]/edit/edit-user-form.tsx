'use client'

import { useActionState } from 'react'
import { updateUser } from '@/app/actions/users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

interface EditUserFormProps {
    user: {
        id: string
        first_name: string | null
        last_name: string | null
        email: string | null
        role: 'admin' | 'staff' | 'manager' | 'member' | 'athlete'
        address?: string | null
        city?: string | null
        zip_code?: string | null
        birth_date?: string | null
        member_id?: string | null
    }
    userRoles: string[]
}

const initialState = {
    message: '',
    error: '',
    success: false,
}

const AVAILABLE_ROLES = [
    { id: 'Bar', label: 'Bar' },
    { id: 'Theke', label: 'Theke (Check-In)' },
    { id: 'Trainer', label: 'Trainer' },
    { id: 'Routenbau', label: 'Routenbau' },
    { id: 'Büro', label: 'Büro/Verwaltung' },
    { id: 'Service', label: 'Service' },
]

export function EditUserForm({ user, userRoles }: EditUserFormProps) {
    const [state, action, isPending] = useActionState(updateUser, initialState)

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Benutzer bearbeiten</CardTitle>
                <CardDescription>Bearbeiten Sie die Daten des Benutzers.</CardDescription>
            </CardHeader>
            <form action={action}>
                <input type="hidden" name="id" value={user.id} />

                <CardContent className="space-y-6">
                    {state?.error && (
                        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                            {state.error}
                        </div>
                    )}
                    {state?.success && (
                        <div className="bg-green-500/15 text-green-600 text-sm p-3 rounded-md">
                            {state.message}
                        </div>
                    )}

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Persönliche Daten</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label
                                    htmlFor="first_name"
                                    className="text-sm font-medium leading-none"
                                >
                                    Vorname *
                                </label>
                                <Input
                                    id="first_name"
                                    name="first_name"
                                    defaultValue={user.first_name || ''}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label
                                    htmlFor="last_name"
                                    className="text-sm font-medium leading-none"
                                >
                                    Nachname *
                                </label>
                                <Input
                                    id="last_name"
                                    name="last_name"
                                    defaultValue={user.last_name || ''}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium leading-none">
                                E-Mail *
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                defaultValue={user.email || ''}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label
                                htmlFor="birth_date"
                                className="text-sm font-medium leading-none"
                            >
                                Geburtsdatum
                            </label>
                            <Input
                                id="birth_date"
                                name="birth_date"
                                type="date"
                                defaultValue={
                                    user.birth_date
                                        ? new Date(user.birth_date).toISOString().split('T')[0]
                                        : ''
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Adresse</h3>
                        <div className="space-y-2">
                            <label htmlFor="address" className="text-sm font-medium leading-none">
                                Straße & Hausnummer
                            </label>
                            <Input
                                id="address"
                                name="address"
                                defaultValue={user.address || ''}
                                placeholder="Musterstraße 123"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1 space-y-2">
                                <label
                                    htmlFor="zip_code"
                                    className="text-sm font-medium leading-none"
                                >
                                    PLZ
                                </label>
                                <Input
                                    id="zip_code"
                                    name="zip_code"
                                    defaultValue={user.zip_code || ''}
                                    placeholder="12345"
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label htmlFor="city" className="text-sm font-medium leading-none">
                                    Stadt
                                </label>
                                <Input
                                    id="city"
                                    name="city"
                                    defaultValue={user.city || ''}
                                    placeholder="Musterstadt"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">System & Rollen</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="role" className="text-sm font-medium leading-none">
                                    System-Rolle *
                                </label>
                                <div className="relative">
                                    <select
                                        id="role"
                                        name="role"
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                        defaultValue={user.role}
                                    >
                                        <option value="member">Mitglied (Member)</option>
                                        <option value="athlete">Athlet</option>
                                        <option value="staff">Mitarbeiter (Staff)</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                    <svg
                                        className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label
                                    htmlFor="member_id"
                                    className="text-sm font-medium leading-none"
                                >
                                    Mitglieds-ID
                                </label>
                                <Input
                                    id="member_id"
                                    name="member_id"
                                    defaultValue={user.member_id || ''}
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Qualifikationen (Schichtplanung)</h3>
                        <p className="text-sm text-muted-foreground">
                            Wählen Sie die Bereiche aus, für die dieser Mitarbeiter in der
                            Schichtplanung vorgesehen werden kann.
                        </p>
                        <div className="grid grid-cols-2 gap-4 border p-4 rounded-md">
                            {AVAILABLE_ROLES.map(role => (
                                <div key={role.id} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={`role_${role.id}`}
                                        name="roles"
                                        value={role.id}
                                        defaultChecked={userRoles.includes(role.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label
                                        htmlFor={`role_${role.id}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {role.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? 'Wird gespeichert...' : 'Speichern'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
