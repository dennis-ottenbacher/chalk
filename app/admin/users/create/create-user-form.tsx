'use client'

import { useActionState } from 'react'
import { createUser } from '@/app/actions/users'
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

const initialState = {
    message: '',
    error: '',
    success: false,
}

export function CreateUserForm() {
    const [state, action, isPending] = useActionState(createUser, initialState)

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Neuen Benutzer anlegen</CardTitle>
                <CardDescription>
                    Erstellen Sie einen neuen Benutzer im System. Felder mit * sind Pflichtfelder.
                </CardDescription>
            </CardHeader>
            <form action={action}>
                <CardContent className="space-y-4">
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="first_name"
                                className="text-sm font-medium leading-none"
                            >
                                Vorname *
                            </label>
                            <Input id="first_name" name="first_name" placeholder="Max" required />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="last_name" className="text-sm font-medium leading-none">
                                Nachname *
                            </label>
                            <Input
                                id="last_name"
                                name="last_name"
                                placeholder="Mustermann"
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
                            placeholder="max@example.com"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="role" className="text-sm font-medium leading-none">
                            Rolle *
                        </label>
                        <div className="relative">
                            <select
                                id="role"
                                name="role"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                defaultValue="staff"
                            >
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
                        <label htmlFor="address" className="text-sm font-medium leading-none">
                            Adresse
                        </label>
                        <Input id="address" name="address" placeholder="Musterstraße 123" />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1 space-y-2">
                            <label htmlFor="zip_code" className="text-sm font-medium leading-none">
                                PLZ
                            </label>
                            <Input id="zip_code" name="zip_code" placeholder="12345" />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label htmlFor="city" className="text-sm font-medium leading-none">
                                Stadt
                            </label>
                            <Input id="city" name="city" placeholder="Musterstadt" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium leading-none">
                            Passwort (Optional)
                        </label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Standard: TempPassword123!"
                            minLength={6}
                        />
                        <p className="text-[0.8rem] text-muted-foreground">
                            Wenn leer gelassen, wird ein temporäres Passwort generiert.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? 'Wird angelegt...' : 'Benutzer anlegen'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
