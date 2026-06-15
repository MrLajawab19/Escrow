# Wallet System Documentation

## Overview

The ScrowX wallet system is a comprehensive financial management solution for buyers and sellers on the escrow platform. It handles fund management, transactions tracking, and integration with the order workflow.

## Features

### 1. **Wallet Management**
- **Account Balance**: Display available balance for immediate use
- **Pending Balance**: Track funds awaiting confirmation
- **Multi-currency Support**: Default USD with extensibility for other currencies
- **Real-time Updates**: Balance refreshes every 30 seconds in the UI

### 2. **Transactions**
- **Transaction History**: Complete audit trail of all wallet activities
- **Transaction Filtering**: Filter by category, type, status, and date range
- **Double-Entry Ledger**: Ensures accuracy with paired credit/debit entries
- **Transaction Categories**:
  - `ESCROW_LOCK`: Funds locked for order escrow
  - `ESCROW_RELEASE`: Funds released to seller upon order completion
  - `WITHDRAWAL`: Funds withdrawn to bank account
  - `REFUND`: Refunds to buyer for cancelled orders
  - `TOP_UP`: Funds added to wallet
  - `FEE`: Platform or transaction fees

### 3. **Funds Management**

#### Top-Up/Deposit
- Multiple payment methods:
  - Credit/Debit Card
  - Bank Transfer
  - Digital Wallets (PayPal, Apple Pay, etc.)
  - Cryptocurrency
- Predefined amounts for quick selection
- 1% processing fee applied
- Immediate balance credit upon successful payment

#### Withdrawal
- **Three-step process**:
  1. Enter withdrawal amount
  2. Provide bank details
  3. Review and confirm
- **Bank Details Required**:
  - Account holder name
  - Bank name
  - Account number
  - Routing number (US) or SWIFT code (International)
- 2% withdrawal fee
- Processing time: 2-5 business days
- Pending withdrawal status tracking

### 4. **Escrow Integration**
- **Automatic Fund Locking**: Funds locked when buyer funds escrow
- **Conditional Release**: Funds released only when order is completed
- **Refund Processing**: Automatic refund if order is cancelled

### 5. **Dashboard & Reporting**
- **Overview Tab**:
  - Current available balance
  - Pending balance
  - Total balance
  - Monthly statistics (income, expenses, net)
  - Quick stats (total transactions, total income/expenses)
  - Last transaction details
- **Transactions Tab**:
  - Paginated transaction history (10 per page)
  - Advanced filtering options
  - Sortable columns
  - Transaction details and status

## Architecture

### Backend

#### Services ([`backend/services/walletService.js`](backend/services/walletService.js))
- `getOrCreateWallet()`: Initialize or retrieve user wallet
- `getWalletWithBalance()`: Calculate current balance from transactions
- `createTransaction()`: Create a new transaction record
- `processTransaction()`: Mark transaction as successful
- `lockEscrowFunds()`: Lock buyer funds for order
- `releaseEscrowFunds()`: Release funds to seller
- `refundBuyer()`: Process refunds
- `topUpWallet()`: Add funds to wallet
- `requestWithdrawal()`: Initiate withdrawal request
- `getTransactionHistory()`: Retrieve filtered transaction history
- `getWalletSummary()`: Get comprehensive wallet overview

#### Controllers ([`backend/controllers/walletController.js`](backend/controllers/walletController.js))
- `getOrCreateWallet()`: POST `/api/wallet/init`
- `getWallet()`: GET `/api/wallet`
- `getWalletSummary()`: GET `/api/wallet/summary`
- `getTransactionHistory()`: GET `/api/wallet/transactions`
- `topUpWallet()`: POST `/api/wallet/top-up`
- `requestWithdrawal()`: POST `/api/wallet/withdraw`
- `completeWithdrawal()`: PATCH `/api/wallet/withdraw/:transactionId/complete`
- `lockEscrowFunds()`: POST `/api/wallet/escrow/lock` (Internal)
- `releaseEscrowFunds()`: POST `/api/wallet/escrow/release` (Internal)
- `refundBuyer()`: POST `/api/wallet/refund` (Internal)

#### Routes ([`backend/routes/wallet.js`](backend/routes/wallet.js))
All routes require authentication via JWT token except internal escrow operations.

#### Utilities ([`backend/utils/walletUtils.js`](backend/utils/walletUtils.js))
Helper functions for:
- Wallet initialization on user signup
- Order-wallet integration
- Refund handling

### Frontend

#### Components

**WalletDashboard** ([`src/components/WalletDashboard.jsx`](src/components/WalletDashboard.jsx))
- Main wallet interface
- Displays balance cards and monthly statistics
- Tab navigation (Overview & Transactions)
- Action buttons (Add Funds, Withdraw)

**WalletHeader** ([`src/components/WalletHeader.jsx`](src/components/WalletHeader.jsx))
- Quick balance display in dashboard header
- Clickable to navigate to full wallet
- Auto-refreshes every 30 seconds

**TransactionHistory** ([`src/components/TransactionHistory.jsx`](src/components/TransactionHistory.jsx))
- Paginated transaction list
- Advanced filtering (category, type, status)
- Transaction details display
- Color-coded status indicators

**TopUpModal** ([`src/components/TopUpModal.jsx`](src/components/TopUpModal.jsx))
- Modal for adding funds
- Predefined amount buttons
- Custom amount input
- Payment method selection
- Fee display
- Success confirmation

**WithdrawalModal** ([`src/components/WithdrawalModal.jsx`](src/components/WithdrawalModal.jsx))
- Three-step withdrawal wizard
- Amount selection
- Bank details form
- Confirmation review
- Fee calculation
- Success notification

### Database

#### Models (Prisma Schema)

**Wallet**
```prisma
model Wallet {
  id             String              @id @default(uuid())
  userId         String              @unique
  userRole       String              // "buyer" | "seller"
  currency       String              @default("USD")
  balance        Float               @default(0)
  pendingBalance Float               @default(0)
  isActive       Boolean             @default(true)
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt
  transactions   WalletTransaction[]
}
```

**WalletTransaction**
```prisma
model WalletTransaction {
  id          String   @id @default(uuid())
  walletId    String
  wallet      Wallet   @relation(fields: [walletId], references: [id])
  type        String   // "CREDIT" | "DEBIT"
  category    String   // Transaction category
  amount      Float    // Original amount
  currency    String   @default("USD")
  status      String   @default("PENDING") // "SUCCESS" | "FAILED"
  description String
  reference   String?  // External ref (order ID, etc.)
  fee         Float    @default(0)
  netAmount   Float    @default(0) // Amount after fees
  metadata    Json?    // Additional data
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Integration Points

### 1. **User Registration**
When a buyer or seller signs up:
1. User account is created in Sequelize
2. Wallet is automatically initialized in Prisma
3. Initial balance: $0
4. Currency: USD (configurable)

### 2. **Order Workflow**
- **Buyer funds escrow**: `walletService.lockEscrowFunds()` creates DEBIT transaction
- **Order completed**: `walletService.releaseEscrowFunds()` creates CREDIT transaction for seller
- **Order refunded**: `walletService.refundBuyer()` creates CREDIT transaction for buyer

### 3. **Dispute Resolution**
- Escrow funds are held until dispute is resolved
- Upon resolution, funds are either released or refunded based on decision

## API Endpoints

### Public Endpoints

#### GET `/api/wallet`
Get user's wallet with calculated balance
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "user-uuid",
    "userRole": "buyer",
    "currency": "USD",
    "balance": 150.50,
    "pendingBalance": 25.00,
    "calculatedBalance": 150.50,
    "pendingBalance": 25.00
  }
}
```

#### GET `/api/wallet/summary`
Get comprehensive wallet summary
```json
{
  "success": true,
  "data": {
    "balance": 150.50,
    "pendingBalance": 25.00,
    "currency": "USD",
    "totalCredit": 500.00,
    "totalDebit": 349.50,
    "totalTransactions": 15,
    "monthlyStats": {
      "monthlyIncome": 150.00,
      "monthlyExpense": 50.00,
      "monthlyNet": 100.00
    },
    "lastTransaction": { ... }
  }
}
```

#### GET `/api/wallet/transactions?limit=50&offset=0&category=TOP_UP&type=CREDIT&status=SUCCESS`
Get transaction history with filters
```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

#### POST `/api/wallet/top-up`
Add funds to wallet
```json
{
  "amount": 100.00,
  "paymentMethod": "card"
}
```

#### POST `/api/wallet/withdraw`
Request withdrawal
```json
{
  "amount": 50.00,
  "bankDetails": {
    "bankName": "Chase Bank",
    "accountNumber": "123456789",
    "accountHolder": "John Doe",
    "routingNumber": "021000021"
  }
}
```

### Internal Endpoints (For Order Operations)

#### POST `/api/wallet/escrow/lock`
Lock funds for escrow
```json
{
  "buyerId": "buyer-uuid",
  "orderId": "order-uuid",
  "amount": 100.00,
  "currency": "USD"
}
```

#### POST `/api/wallet/escrow/release`
Release funds to seller
```json
{
  "sellerId": "seller-uuid",
  "orderId": "order-uuid",
  "amount": 100.00,
  "currency": "USD"
}
```

#### POST `/api/wallet/refund`
Refund buyer
```json
{
  "buyerId": "buyer-uuid",
  "orderId": "order-uuid",
  "amount": 100.00,
  "currency": "USD",
  "reason": "Order cancelled"
}
```

## Fee Structure

| Operation | Fee | Applied To |
|-----------|-----|-----------|
| Top-up | 1% | Processing fee |
| Withdrawal | 2% | Withdrawal fee |
| Escrow Lock | 0% | No fee |
| Escrow Release | 0% | No fee |
| Refund | 0% | No fee |

## Security Considerations

1. **Authentication**: All endpoints require JWT authentication
2. **Authorization**: Users can only access their own wallet
3. **Transaction Verification**: Double-entry ledger ensures data integrity
4. **Fee Protection**: Fees are calculated server-side, not client-side
5. **Balance Validation**: Withdrawal requests validate sufficient balance
6. **Audit Trail**: All transactions are logged with metadata

## Error Handling

The wallet system includes comprehensive error handling:
- Invalid amounts
- Insufficient balance
- Authentication failures
- Database errors
- Payment processing errors

## Future Enhancements

1. **Payment Gateway Integration**
   - Stripe for card payments
   - PayPal integration
   - Cryptocurrency support

2. **Advanced Features**
   - Scheduled withdrawals
   - Recurring top-ups
   - Budget limits
   - Spending alerts

3. **Reporting**
   - Tax reports
   - Monthly statements
   - Export functionality

4. **Mobile App**
   - Native mobile wallet interface
   - Push notifications
   - Biometric authentication

## Testing

To test the wallet system:

1. **Sign up** as a buyer or seller (wallet auto-initializes)
2. **Navigate** to the wallet via the dashboard header
3. **Add funds** using the "Add Funds" button
4. **View balance** and transaction history
5. **Request withdrawal** with valid bank details
6. **Filter transactions** to verify proper categorization

## Troubleshooting

### Wallet not appearing
- Clear browser cache and localStorage
- Ensure JWT token is valid
- Check network tab for API errors

### Transaction not processing
- Verify sufficient balance
- Check transaction status in history
- Review error message for details

### Balance discrepancy
- Refresh page to get latest data
- Check for pending transactions
- Verify transaction history is complete

## Support

For issues or questions about the wallet system, please contact support@scrowx.com

---

**Last Updated**: May 23, 2026
**Version**: 1.0.0
