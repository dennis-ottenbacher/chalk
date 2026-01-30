'use client'

import { updateSettings } from '@/app/actions/settings'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useState, useTransition } from 'react'
import { Loader2, Info } from 'lucide-react'
import { getVoucherValidityExplanation, getVoucherValidityExample } from '@/lib/voucher-validity'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'

interface VoucherValiditySettingsProps {
    initialSettings: {
        voucher_validity_years: number
        voucher_validity_mode: 'exact_date' | 'year_end'
    }
}

export default function VoucherValiditySettings({ initialSettings }: VoucherValiditySettingsProps) {
    const [isPending, startTransition] = useTransition()
    const [validityYears, setValidityYears] = useState(initialSettings.voucher_validity_years)
    const [validityMode, setValidityMode] = useState(initialSettings.voucher_validity_mode)
    const [isOpen, setIsOpen] = useState(false)

    const handleYearsChange = (value: string) => {
        const years = parseInt(value)
        setValidityYears(years)
        startTransition(async () => {
            try {
                await updateSettings({ voucher_validity_years: years })
            } catch (error) {
                console.error(error)
                setValidityYears(initialSettings.voucher_validity_years)
            }
        })
    }

    const handleModeChange = (value: 'exact_date' | 'year_end') => {
        setValidityMode(value)
        startTransition(async () => {
            try {
                await updateSettings({ voucher_validity_mode: value })
            } catch (error) {
                console.error(error)
                setValidityMode(initialSettings.voucher_validity_mode)
            }
        })
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="rounded-md border bg-white">
                <CollapsibleTrigger className="w-full p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5 text-left">
                            <div className="text-base font-medium flex items-center gap-2">
                                Voucher Validity
                                {isPending && (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {getVoucherValidityExplanation(validityYears, validityMode)}
                            </div>
                        </div>
                        <ChevronDown
                            className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                    </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <div className="border-t p-6 space-y-6">
                        {/* Validity Years */}
                        <div className="space-y-3">
                            <Label htmlFor="validity-years" className="text-sm font-medium">
                                Validity Period
                            </Label>
                            <Select
                                value={validityYears.toString()}
                                onValueChange={handleYearsChange}
                                disabled={isPending}
                            >
                                <SelectTrigger id="validity-years" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 Year</SelectItem>
                                    <SelectItem value="2">2 Years</SelectItem>
                                    <SelectItem value="3">3 Years (Default)</SelectItem>
                                    <SelectItem value="4">4 Years</SelectItem>
                                    <SelectItem value="5">5 Years</SelectItem>
                                    <SelectItem value="10">10 Years</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Validity Mode */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Calculation Method</Label>
                            <RadioGroup
                                value={validityMode}
                                onValueChange={handleModeChange}
                                disabled={isPending}
                                className="space-y-3"
                            >
                                <div className="flex items-start space-x-3 space-y-0">
                                    <RadioGroupItem
                                        value="year_end"
                                        id="year_end"
                                        className="mt-0.5"
                                    />
                                    <div className="space-y-1 flex-1">
                                        <Label
                                            htmlFor="year_end"
                                            className="font-normal cursor-pointer"
                                        >
                                            <span className="font-medium">Until Year End</span>
                                            <span className="text-muted-foreground">
                                                {' '}
                                                (recommended)
                                            </span>
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Vouchers are valid until December 31st of the{' '}
                                            {validityYears}
                                            {getOrdinalSuffix(validityYears)} year after purchase.
                                            Accounting-friendly, as all vouchers from one year
                                            expire on the same date.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3 space-y-0">
                                    <RadioGroupItem
                                        value="exact_date"
                                        id="exact_date"
                                        className="mt-0.5"
                                    />
                                    <div className="space-y-1 flex-1">
                                        <Label
                                            htmlFor="exact_date"
                                            className="font-normal cursor-pointer"
                                        >
                                            <span className="font-medium">Exact Date</span>
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Vouchers are valid for exactly {validityYears}{' '}
                                            {validityYears === 1 ? 'year' : 'years'} from purchase
                                            date. Simple to calculate, but many different expiry
                                            dates.
                                        </p>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Example */}
                        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                            <div className="flex gap-2">
                                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-blue-900">
                                        {getVoucherValidityExample(validityYears, validityMode)}
                                    </p>
                                    <p className="text-xs text-blue-700">
                                        This setting applies to all newly created vouchers. Existing
                                        vouchers retain their original expiry date.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    )
}

// Helper function for ordinal suffix
function getOrdinalSuffix(num: number): string {
    const j = num % 10
    const k = num % 100
    if (j === 1 && k !== 11) return 'st'
    if (j === 2 && k !== 12) return 'nd'
    if (j === 3 && k !== 13) return 'rd'
    return 'th'
}
