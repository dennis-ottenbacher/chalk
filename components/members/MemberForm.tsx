'use client'

import { useActionState } from 'react'
import { createMember, type MemberFormState } from '@/app/actions/members'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const initialState: MemberFormState = {}

export function MemberForm() {
    const [state, formAction, isPending] = useActionState(createMember, initialState)

    return (
        <form action={formAction} className="space-y-6">
            {state.success && (
                <div className="rounded-md bg-success/10 p-4 text-success border border-success/20">
                    Member created successfully!
                </div>
            )}

            {state.error && (
                <div className="rounded-md bg-destructive/10 p-4 text-destructive border border-destructive/20">
                    {state.error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input id="first_name" name="first_name" required />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input id="last_name" name="last_name" required />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required minLength={6} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select name="role" defaultValue="member">
                        <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="athlete">Athlete</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="member_id">Member ID / Card (Optional)</Label>
                    <Input id="member_id" name="member_id" placeholder="Scan card or enter ID" />
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Creating...' : 'Create Member'}
                </Button>
            </div>
        </form>
    )
}
