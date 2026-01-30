/**
 * Calculates the expiry date for a voucher based on the validity settings
 *
 * @param purchaseDate - The date when the voucher was purchased
 * @param validityYears - Number of years the voucher is valid
 * @param validityMode - 'exact_date' (X years from purchase) or 'year_end' (until end of Xth year)
 * @returns The calculated expiry date
 */
export function calculateVoucherExpiry(
    purchaseDate: Date,
    validityYears: number,
    validityMode: 'exact_date' | 'year_end'
): Date {
    const expiry = new Date(purchaseDate)

    if (validityMode === 'exact_date') {
        // Add X years to the purchase date
        expiry.setFullYear(expiry.getFullYear() + validityYears)
    } else {
        // Set to December 31st of the (current year + X years)
        expiry.setFullYear(expiry.getFullYear() + validityYears)
        expiry.setMonth(11) // December (0-indexed)
        expiry.setDate(31)
        expiry.setHours(23, 59, 59, 999) // End of day
    }

    return expiry
}

/**
 * Formats the voucher validity explanation for display
 */
export function getVoucherValidityExplanation(
    validityYears: number,
    validityMode: 'exact_date' | 'year_end'
): string {
    if (validityMode === 'exact_date') {
        return `Vouchers are valid for ${validityYears} ${validityYears === 1 ? 'year' : 'years'} from purchase date.`
    } else {
        return `Vouchers are valid until the end of the ${validityYears}${getOrdinalSuffix(validityYears)} year after purchase.`
    }
}

/**
 * Provides an example of when a voucher would expire
 */
export function getVoucherValidityExample(
    validityYears: number,
    validityMode: 'exact_date' | 'year_end'
): string {
    const today = new Date()
    const expiry = calculateVoucherExpiry(today, validityYears, validityMode)

    const purchaseStr = today.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
    })

    const expiryStr = expiry.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
    })

    return `Example: Purchased on ${purchaseStr} → Valid until ${expiryStr}`
}

/**
 * Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(num: number): string {
    const j = num % 10
    const k = num % 100
    if (j === 1 && k !== 11) return 'st'
    if (j === 2 && k !== 12) return 'nd'
    if (j === 3 && k !== 13) return 'rd'
    return 'th'
}
