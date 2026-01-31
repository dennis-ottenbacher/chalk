'use client'

import { updateSettings, type Settings } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'

interface CompanySettingsFormProps {
    initialSettings: Settings
}

export default function CompanySettingsForm({ initialSettings }: CompanySettingsFormProps) {
    const [isPending, startTransition] = useTransition()

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            try {
                const settings: Partial<Settings> = {
                    company_name: formData.get('company_name') as string,
                    company_address: formData.get('company_address') as string,
                    company_zip: formData.get('company_zip') as string,
                    company_city: formData.get('company_city') as string,
                    company_country: formData.get('company_country') as string,
                    company_tax_id: formData.get('company_tax_id') as string,
                    company_vat_id: formData.get('company_vat_id') as string,
                }

                await updateSettings(settings)
                // console.log('Company information saved')
            } catch (error) {
                console.error(error)
                console.error('Failed to save company information')
            }
        })
    }

    return (
        <div className="rounded-md border border-border bg-card p-6">
            <div className="mb-4">
                <h3 className="text-lg font-medium">Company Information</h3>
                <p className="text-sm text-muted-foreground">
                    This information will be displayed on invoices and receipts.
                </p>
            </div>
            <Separator className="my-4" />
            <form action={handleSubmit} className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                        id="company_name"
                        name="company_name"
                        defaultValue={initialSettings.company_name || ''}
                        placeholder="e.g. Acme Boulder Gym GmbH"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="company_address">Address (Street & No.)</Label>
                    <Input
                        id="company_address"
                        name="company_address"
                        defaultValue={initialSettings.company_address || ''}
                        placeholder="e.g. Boulderstraße 1"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="company_zip">ZIP Code</Label>
                        <Input
                            id="company_zip"
                            name="company_zip"
                            defaultValue={initialSettings.company_zip || ''}
                            placeholder="e.g. 10115"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="company_city">City</Label>
                        <Input
                            id="company_city"
                            name="company_city"
                            defaultValue={initialSettings.company_city || ''}
                            placeholder="e.g. Berlin"
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="company_country">Country</Label>
                    <Input
                        id="company_country"
                        name="company_country"
                        defaultValue={initialSettings.company_country || 'DE'}
                        placeholder="e.g. DE"
                        maxLength={2}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="company_tax_id">Tax ID (Steuernummer)</Label>
                        <Input
                            id="company_tax_id"
                            name="company_tax_id"
                            defaultValue={initialSettings.company_tax_id || ''}
                            placeholder="e.g. 12/345/67890"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="company_vat_id">VAT ID (USt-IdNr.)</Label>
                        <Input
                            id="company_vat_id"
                            name="company_vat_id"
                            defaultValue={initialSettings.company_vat_id || ''}
                            placeholder="e.g. DE123456789"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    )
}
