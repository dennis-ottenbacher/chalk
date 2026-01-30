# Phase 4: POS & Checkout

## 1. Product Grid Interface

- **Feature**: Tablet-friendly grid for selecting items.
- **Implementation**:
    - **UI**: Visual cards with Image, Name, Price.
    - **Filtering**: Categories (Drink, Snack, Gear, Day Pass).
    - **Optimization**: Client-side filtering of server-fetched `products` list.

## 2. Shopping Cart

- **Feature**: Manage selected items before purchase.
- **Implementation**:
    - **State**: React Context or Zustand store for `CartItems`.
    - **Actions**: Add Item, Remove Item, Update Quantity, Apply Discount.
    - **UI**: Sidebar or Drawer showing current total.

## 3. Checkout Flow

- **Feature**: Process payments.
- **Implementation**:
    - **Methods**: Cash, Card (External Terminal), SEPA (optional).
    - **Integration**:
        - _Cash_: Simple "Confirm" button.
        - _Card_: Placeholder for external SumUp/Zettle integration or manual "Paid via Terminal" log.
    - **Validation**: Ensure Cart is not empty.

## 4. Receipt Generation

- **Feature**: Proof of purchase.
- **Implementation**:
    - **Digital**: Email receipt to Member (if registered).
    - **Print**: Generate simple HTML/PDF optimization for thermal printers (58mm/80mm).
