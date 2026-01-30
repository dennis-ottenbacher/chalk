# Voucher Validity: Settings Explanation

## Overview

This setting determines how long vouchers remain valid after purchase. There are two calculation methods:

## Option 1: Until Year End (recommended)

**Example:** Voucher purchased on March 15, 2026, validity 3 years
→ **Valid until: December 31, 2029**

### Advantages:

- ✅ **Accounting-friendly**: All vouchers from one purchase year expire on the same date
- ✅ **Easier year-end closing**: Provisions can be calculated annually
- ✅ **Customer-friendly**: Vouchers are valid slightly longer (purchased in January = almost 4 years)
- ✅ **Clear communication**: "Vouchers are valid for 3 years, until the end of the third year"

### Disadvantages:

- ❌ Slightly more complex calculation (but automatic)

### Recommended for:

- Gyms and leisure facilities
- Companies with standardized accounting
- Businesses that sell many vouchers

## Option 2: Exact Date

**Example:** Voucher purchased on March 15, 2026, validity 3 years
→ **Valid until: March 15, 2029**

### Advantages:

- ✅ **Simple to calculate**: Exactly X years from purchase date
- ✅ **Clear for customers**: Exactly 3 years validity

### Disadvantages:

- ❌ **Many different expiry dates**: Different vouchers expire every day
- ❌ **Complex accounting**: Provisions must be adjusted daily
- ❌ **Difficult year-end closing**: Vouchers expire throughout the year

### Recommended for:

- Small businesses with few vouchers
- Companies without complex accounting requirements

## Legal Background (Germany)

Under German law (§ 195 BGB), the **regular limitation period is 3 years**.
There is no special legal regulation for vouchers, so 3 years is a good standard.

## Technical Implementation

- The setting applies to **all newly created vouchers**
- Existing vouchers retain their original expiry date
- The expiry date is automatically calculated at purchase and stored in the database
- For "Until Year End", the date is set to 11:59:59 PM on December 31st

## Recommendation

For most gyms and leisure facilities, we recommend:

- **Validity Period**: 3 years
- **Calculation Method**: Until Year End

This offers the best balance between customer-friendliness and accounting efficiency.
