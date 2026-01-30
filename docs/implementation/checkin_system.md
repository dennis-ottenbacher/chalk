# Check-in System Implementation

The check-in system is the core "Fast Lane" feature of Chalk. It allows for quick validation of customer membership via QR code scanning or manual ID entry.

## UI Design (`app/checkin/page.tsx`)

The check-in page is designed for efficiency at the front desk.

### Key Features:

- **Auto-focusing Scanner Input**: The input field automatically regains focus after each scan or blur, ensuring it's always ready for the hardware scanner.
- **Large Visual Feedback**: A prominent status card provides immediate "GREEN/RED" feedback to the staff member.
- **User Profile Preview**: Displays customer details (name, role) and subscription status (e.g., remaining entries for 10-packs).
- **Persistent Scanner Focus**: Uses a `useEffect` and `blur` event listener with a short timeout to ensure input is always ready for hardware scanners.
- **Full-Screen Status**: The UI is optimized for full-screen display to provide clear feedback at a distance.

### Persistent Focus Pattern

```tsx
useEffect(() => {
    inputRef.current?.focus()

    const handleBlur = () => {
        // Short timeout to allow potential UI interactions before stealing focus back
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
```

## Server Action (`app/actions/checkin.ts`)

The `checkInUser` function handles the check-in business logic by interacting with the Supabase database.

### Implementation Logic:

1.  **Profile Lookup**: Search for a profile using the `member_id` identifier.
2.  **Subscription Validation**: Look for an active subscription (`is_active: true`) linked to the user.
3.  **Entry Management (10-Cards)**:
    - If `remaining_entries` is not null, the system checks if entries are available.
    - If entries remain, it decrements the count and marks the check-in as `valid`.
4.  **Time-based Validation**:
    - If an `end_date` exists, the system verifies the current date is before the expiration.
5.  **Activity Logging**: Every check-in attempt is recorded in the `checkins` table with a status (`valid` or `invalid`), timestamp, and metadata (staff, location).
    - Status is cast to the `checkin_status` enum type in PostgreSQL to ensure data integrity.

### Technical Details:

- **Server Client**: Uses the Supabase server client for data verification and updates.
- **Feedback**: Returns a structured `CheckInResult` containing success status, user-facing message, and user profile data (name, role) for CLI feedback.
