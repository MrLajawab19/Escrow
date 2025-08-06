# Revert Orders Command

This command resets all test orders back to their original statuses for testing purposes.

## Usage

```bash
npm run revert-orders
```

or

```bash
node revert-orders.js
```

## What it does

The command will:

1. **Find existing users**: `buyer@example.com` and `seller@example.com`
2. **Reset all orders** to their original statuses:
   - Order 1: Professional Logo Design → `PLACED`
   - Order 2: E-commerce Website Development → `ESCROW_FUNDED`
   - Order 3: Mobile App Development → `IN_PROGRESS`
   - Order 4: Product Marketing Video → `SUBMITTED`
3. **Reset order logs** to match the original status
4. **Reset delivery files** (only for SUBMITTED orders)

## Testing Scenarios

After running the revert command, you can test:

- **Order 1 (PLACED)**: Test "Fund Escrow" button
- **Order 2 (ESCROW_FUNDED)**: Test "Accept/Reject/Request Changes" buttons
- **Order 3 (IN_PROGRESS)**: Test "Submit Delivery" button
- **Order 4 (SUBMITTED)**: Test "Approve/Dispute" buttons

## Login Credentials

- **Buyer**: `buyer@example.com` / `password123`
- **Seller**: `seller@example.com` / `password123`

## When to use

Run this command:
- After testing all action buttons
- When you want to reset orders to their initial states
- Before demonstrating the application to others
- When orders get stuck in unexpected states

## File Location

The script is located at: `revert-orders.js` 