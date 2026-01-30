'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { createLandingPage } from '@/app/actions/landing-pages'
import { toast } from 'sonner'

export function CreateLandingPageDialog() {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState('')
    const [slug, setSlug] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setTitle(value)
        // Auto-generate slug from title
        const newSlug = value
            .toLowerCase()
            .replace(/ä/g, 'ae')
            .replace(/ö/g, 'oe')
            .replace(/ü/g, 'ue')
            .replace(/ß/g, 'ss')
            .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
            .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
        setSlug(newSlug)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const result = await createLandingPage({
                title,
                slug,
                html_content: '', // Start empty
                is_published: false,
            })

            if (result.success) {
                toast.success('Landing page created successfully')
                setOpen(false)
                setTitle('')
                setSlug('')
                router.refresh()
            } else {
                toast.error(result.error || 'Failed to create landing page')
            }
        } catch (error) {
            console.error('Error creating landing page:', error)
            toast.error('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Landing Page
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Landing Page</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={handleTitleChange}
                            placeholder="e.g. Summer Sale"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                            id="slug"
                            value={slug}
                            onChange={e => setSlug(e.target.value)}
                            placeholder="e.g. summer-sale"
                            required
                        />
                        <p className="text-xs text-muted-foreground">URL: /landing-page/{slug}</p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Page'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
