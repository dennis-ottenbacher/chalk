'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertCircle, CheckCircle2, Search, User } from 'lucide-react'
import { checkInUser } from '@/app/actions/checkin'

type CheckInResult = {
    success: boolean
    message: string
    user?: {
        firstName: string
        lastName: string
        role: string
        avatarUrl?: string
        memberId: string
    }
    tariffName?: string
    remainingEntries?: number
}

export default function CheckInPage() {
    const [inputVal, setInputVal] = useState('')
    const [lastResult, setLastResult] = useState<CheckInResult | null>(null)
    const [loading, setLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Auto-focus input on mount and keep it focused for scanner
    useEffect(() => {
        inputRef.current?.focus()

        // Optional: Re-focus after blur if we want "kiosk mode" feel
        const handleBlur = () => {
            setTimeout(() => inputRef.current?.focus(), 100)
        }

        const input = inputRef.current
        if (input) {
            input.addEventListener('blur', handleBlur)
        }

        return () => {
            if (input) input.removeEventListener('blur', handleBlur)
        }
    }, [])

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputVal.trim()) return

        setLoading(true)
        // Optimistic UI could go here
        try {
            const result = await checkInUser(inputVal)
            setLastResult(result)
            setInputVal('') // Clear for next scan
        } catch (error) {
            console.error('Check-in failed', error)
            setLastResult({ success: false, message: 'Systemfehler beim Check-in.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto p-4 max-w-full h-screen flex flex-col">
            <header className="mb-4 flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Check-in / Fast Lane</h1>
                <Badge
                    variant="outline"
                    className={
                        loading ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                    }
                >
                    {loading ? 'Verarbeite...' : 'Bereit'}
                </Badge>
            </header>

            <div className="flex flex-col gap-6 flex-grow">
                {/* Input Area */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>Scanner Eingabe</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleScan} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    ref={inputRef}
                                    placeholder="QR-Code scannen oder ID tippen..."
                                    className="pl-8"
                                    value={inputVal}
                                    onChange={e => setInputVal(e.target.value)}
                                    disabled={loading}
                                    autoComplete="off"
                                />
                            </div>
                            <Button type="submit" disabled={loading}>
                                Check-in
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Status Display - Takes remaining space */}
                <div className="flex-grow">
                    {lastResult ? (
                        <Card
                            className={`h-full border-4 flex flex-col justify-center items-center text-center p-8 transition-colors ${
                                lastResult.success
                                    ? 'border-success bg-success/5'
                                    : 'border-destructive bg-destructive/5'
                            }`}
                        >
                            <div
                                className={`rounded-full p-4 mb-6 ${lastResult.success ? 'bg-success/15' : 'bg-destructive/15'}`}
                            >
                                {lastResult.success ? (
                                    <CheckCircle2 className="w-24 h-24 text-success" />
                                ) : (
                                    <AlertCircle className="w-24 h-24 text-destructive" />
                                )}
                            </div>

                            <h2 className="text-4xl font-extrabold mb-2">
                                {lastResult.success ? 'Zutritt Genehmigt' : 'Zutritt Verweigert'}
                            </h2>
                            <p className="text-xl text-muted-foreground mb-8">
                                {lastResult.message}
                            </p>

                            {lastResult.user && (
                                <div className="animate-in fade-in zoom-in duration-300">
                                    <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-white shadow-lg">
                                        <AvatarImage src={lastResult.user.avatarUrl} />
                                        <AvatarFallback className="text-4xl">
                                            {lastResult.user.firstName[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h3 className="text-2xl font-bold">
                                        {lastResult.user.firstName} {lastResult.user.lastName}
                                    </h3>
                                    <div className="flex justify-center gap-2 mt-2">
                                        <Badge variant="secondary">{lastResult.user.role}</Badge>
                                        {lastResult.tariffName && (
                                            <Badge>{lastResult.tariffName}</Badge>
                                        )}
                                    </div>
                                    {lastResult.remainingEntries !== undefined && (
                                        <div className="mt-4 p-3 bg-card rounded-lg border shadow-sm inline-block">
                                            <span className="block text-xs uppercase text-muted-foreground font-bold">
                                                Verbleibende Einträge
                                            </span>
                                            <span className="text-2xl font-mono font-bold">
                                                {lastResult.remainingEntries}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    ) : (
                        <Card className="h-full flex flex-col justify-center items-center text-center border-dashed border-2">
                            <User className="w-24 h-24 text-muted-foreground/20 mb-4" />
                            <h2 className="text-2xl font-semibold text-muted-foreground">
                                Bereit zum Scannen
                            </h2>
                            <p className="text-muted-foreground max-w-xs mt-2">
                                Scanne einen QR-Code, um den Status hier anzuzeigen.
                            </p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
