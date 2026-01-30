import { MemberForm } from '@/components/members/MemberForm'

export default function AddMemberPage() {
    return (
        <div className="container mx-auto py-10">
            <div className="mx-auto max-w-2xl">
                <div className="mb-8 space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Add New Member</h1>
                    <p className="text-muted-foreground">
                        Create a new member account. They will receive an email to confirm their
                        account.
                    </p>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6">
                        <MemberForm />
                    </div>
                </div>
            </div>
        </div>
    )
}
