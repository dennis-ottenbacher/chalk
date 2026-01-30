# Functional Requirements

## 1. Core POS Features

- **TSE Compliance**: Automated signing of transactions per German regulations.
- **Payments**: Support for Cash, Cards, Vouchers, and SEPA Direct Debit (for memberships).
- **Receipts**: Physical (thermal printer) and digital options (Email/QR).
- **Access Control**: Role-based permissions (Staff, Shift Lead, Admin).

## 2. Boulder-Specific Management

- **Membership & Subscriptions**:
    - Recurring memberships (auto-pay via SEPA).
    - Multi-entry cards (e.g., 10-packs) with automatic decrement on check-in.
    - Status tracking (Paused, Cancelled, Active).
- **Check-in & Fast Lane**:
    - QR-Code based check-in (via mobile app/Apple Wallet).
    - **V1 Process**: Staff-led scanning using handheld scanners or tablet cameras.
    - **Visual Feedback**: Immediate green/red status display and customer photo for verification.
- **Waivers (Digital Disclaimer)**:
    - Digitale Erfassung. Check-in only possible if a valid waiver is on file (Hard block).
- **Rental Management (V1)**:
    - Simplified tracking: Rental gear is treated as a standard service product (e.g., "Rental Shoes Day Pass").
    - No named inventory assignment (e.g., "Shoe #42") in V1.
- **Group & Family Management**:
    - Managing youth teams and fixed groups.
    - Family accounts where one primary member pays for multiple check-ins.

## 3. Course & Event Management

- **Booking System**: Online and on-site booking for courses.
- **Capacity Control**: Managing participant limits and waitlists.

## 4. Personal Planning

- **Shift Scheduling**: Integrated roster management for gym staff directly within the POS.
