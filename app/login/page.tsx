import { login } from './actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default async function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
    const searchParams = await props.searchParams

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl">Access Chalk</CardTitle>
                    <CardDescription>Enter your credentials to access the system</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Error Message */}
                    {searchParams.error && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                            {searchParams.error === 'backend_unavailable'
                                ? 'Unable to connect to the database. Please ensure the backend is running.'
                                : searchParams.error}
                        </div>
                    )}

                    <form className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="staff@chalk.gym"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        <Button formAction={login} className="w-full">
                            Sign In
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
