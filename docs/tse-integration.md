# TSE Integration Guide

## Overview

Chalk POS now includes full support for **TSE (Technische Sicherheitseinrichtung)** compliance via **fiskaly Cloud TSE**. This ensures your POS system meets German fiscal requirements (KassenSichV).

## Features

✅ **Automatic Transaction Signing** - Every transaction is cryptographically signed  
✅ **Cloud-based TSE** - No hardware required, works anywhere  
✅ **DSFinV-K Export** - Tax audit-ready data export  
✅ **Graceful Degradation** - Transactions continue even if TSE fails  
✅ **Multi-tenancy Support** - Each organization has its own TSE configuration

## Architecture

```
┌─────────────────┐
│   POS Frontend  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  createTransaction()    │
│  (Server Action)        │
└────────┬────────────────┘
         │
         ├─────────────────────┐
         │                     │
         ▼                     ▼
┌─────────────────┐   ┌──────────────────┐
│  Save to DB     │   │  TSE Manager     │
│  (Supabase)     │   │  (if enabled)    │
└─────────────────┘   └────────┬─────────┘
                               │
                               ▼
                      ┌─────────────────┐
                      │ Fiskaly Service │
                      │  - Start TX     │
                      │  - Finish TX    │
                      │  - Get Signature│
                      └────────┬────────┘
                               │
                               ▼
                      ┌─────────────────┐
                      │  fiskaly API    │
                      │  (Cloud TSE)    │
                      └─────────────────┘
```

## Setup

### 1. Database Migration

Run the TSE migration to add required tables:

```bash
cd /Users/dennisottenbacher/Development/Chalk
npx supabase migration up
```

This creates:

- `tse_data` column in `transactions` table
- `tse_configurations` table for organization settings

### 2. Get fiskaly Credentials

1. Sign up at [fiskaly.com](https://fiskaly.com)
2. Create a new organization
3. Create a TSS (Technical Security System)
4. Create a client
5. Get your API credentials:
    - API Key
    - API Secret
    - TSS ID
    - Client ID

### 3. Configure TSE in Admin Panel

1. Navigate to **Admin → Settings → TSE**
2. Enter your fiskaly credentials
3. Select environment (Sandbox for testing, Production for live)
4. Click **Save Configuration**
5. Click **Test Connection** to verify

## Usage

### Automatic Transaction Signing

Once configured, all transactions are automatically signed:

```typescript
// In app/actions/transactions.ts
const transaction = await createTransaction({
    items: [...],
    totalAmount: 100.00,
    paymentMethod: 'card'
});

// TSE signature is automatically added to transaction.tse_data
```

### TSE Data Structure

Each signed transaction includes:

```typescript
{
    transaction_number: 123,      // Sequential TSE transaction number
    signature_value: "ABC123...", // Cryptographic signature
    signature_counter: 456,       // Signature counter
    time_start: 1234567890,       // Unix timestamp
    time_end: 1234567891,         // Unix timestamp
    qr_code_data: "V0;...",       // QR code for receipt
    tss_id: "your-tss-id",
    client_id: "your-client-id"
}
```

### DSFinV-K Export

For tax audits, export transaction data:

1. Go to **Admin → Settings → TSE**
2. Select date range
3. Click **Export DSFinV-K**
4. Provide the `.tar` file to your tax auditor

## Error Handling

The system uses **graceful degradation**:

- ✅ If TSE is configured and working: Transactions are signed
- ⚠️ If TSE fails: Transaction still completes, error is logged
- ℹ️ If TSE is not configured: Transactions work normally without signatures

This ensures your POS never stops working due to TSE issues.

## VAT Configuration

Default VAT rate is **19%** (German standard rate). To customize:

```typescript
// In app/actions/transactions.ts, modify:
vat_rate: 19, // Change to 7 for reduced rate, or make configurable
```

## Testing

### Sandbox Mode

Use fiskaly's sandbox environment for testing:

1. Set environment to "Sandbox" in TSE settings
2. Use sandbox credentials
3. Test transactions won't affect production data

### Production Mode

Switch to production when ready:

1. Create production TSS in fiskaly dashboard
2. Update credentials in TSE settings
3. Set environment to "Production"

## Compliance Notes

### Legal Requirements (Germany)

✅ **KassenSichV compliant** - All transactions cryptographically signed  
✅ **DSFinV-K export** - Tax audit data available  
✅ **Tamper-proof** - Signatures cannot be altered  
✅ **Sequential numbering** - Transaction numbers are sequential

### Receipt Requirements

For full compliance, receipts should include:

- Transaction number (`tse_data.transaction_number`)
- TSS ID (`tse_data.tss_id`)
- Signature counter (`tse_data.signature_counter`)
- QR code (`tse_data.qr_code_data`)

## Troubleshooting

### "TSE not configured"

- Check that TSE configuration exists in Admin → Settings
- Verify `is_active` is true
- Test connection

### "Authentication failed"

- Verify API key and secret are correct
- Check if credentials are for correct environment (sandbox vs production)
- Ensure fiskaly account is active

### "Transaction signing failed"

- Check fiskaly dashboard for TSS status
- Verify client is registered with TSS
- Check network connectivity
- Review server logs for detailed error

### Transactions not being signed

- Verify TSE is active: `is_active = true`
- Check that organization has TSE configuration
- Review console logs for TSE initialization errors

## API Reference

### Server Actions

```typescript
// Get TSE configuration
const config = await getTseConfig()

// Save TSE configuration
await saveTseConfig({
    api_key: '...',
    api_secret: '...',
    tss_id: '...',
    client_id: '...',
    environment: 'production',
})

// Test connection
const result = await testTseConnection()

// Deactivate TSE
await deactivateTse()

// Export DSFinV-K
const data = await exportDSFinVK('2024-01-01', '2024-12-31')
```

### TSE Manager

```typescript
import { getTseManager } from '@/lib/tse/tse-manager'

const tseManager = await getTseManager(organizationId)

// Check if enabled
if (tseManager.isEnabled()) {
    // Sign transaction
    const signature = await tseManager.signTransaction(
        transactionId,
        totalAmount,
        paymentMethod,
        items
    )
}
```

## Security

- 🔒 API credentials stored encrypted in database
- 🔒 Credentials never sent to client
- 🔒 Admin-only access to TSE configuration
- 🔒 RLS policies protect TSE data

## Support

For fiskaly-specific issues:

- [fiskaly Documentation](https://developer.fiskaly.com)
- [fiskaly Support](https://fiskaly.com/support)

For Chalk integration issues:

- Check server logs
- Review this documentation
- Contact your system administrator
