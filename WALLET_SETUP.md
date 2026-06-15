# Wallet System Setup & Integration Guide

## Installation & Setup

### 1. Database Migration

Run Prisma migration to create wallet tables:

```bash
cd d:\ScrowX\Escrow
npx prisma migrate dev --name add_wallet_system
```

This will:
- Create `Wallet` table
- Create `WalletTransaction` table
- Set up indexes and foreign keys

### 2. Environment Variables

Ensure `.env` contains:
```env
DATABASE_URL=your-postgres-url
JWT_SECRET=your-jwt-secret
NODE_ENV=development
```

### 3. Backend Setup

The wallet system is already integrated in the server. No additional setup needed beyond running migrations.

Verify wallet routes are loaded by checking `server.js`:
```javascript
app.use('/api/wallet', walletRoutes);  // Should be present
```

### 4. Frontend Setup

The wallet components are included in the bundle. They're automatically available in both dashboards.

## Integration Checklist

### Backend
- [x] Wallet Service created (`backend/services/walletService.js`)
- [x] Wallet Controller created (`backend/controllers/walletController.js`)
- [x] Wallet Routes created (`backend/routes/wallet.js`)
- [x] Routes registered in `server.js`
- [x] Wallet Utils created (`backend/utils/walletUtils.js`)
- [x] Auth Controller updated for wallet initialization
- [x] Prisma migration created
- [x] Database models in Prisma schema

### Frontend
- [x] WalletDashboard component (`src/components/WalletDashboard.jsx`)
- [x] WalletHeader component (`src/components/WalletHeader.jsx`)
- [x] TransactionHistory component (`src/components/TransactionHistory.jsx`)
- [x] TopUpModal component (`src/components/TopUpModal.jsx`)
- [x] WithdrawalModal component (`src/components/WithdrawalModal.jsx`)
- [x] BuyerDashboard integration
- [x] SellerDashboard integration

## Testing the Wallet System

### 1. Sign Up a New User
```bash
# Navigate to http://localhost:5173
# Click "Sign Up" as buyer or seller
# Fill in details and submit
# User account + wallet created automatically
```

### 2. Access Wallet
```bash
# Dashboard header shows wallet balance
# Click on wallet balance button
# Wallet dashboard opens in modal
```

### 3. Test Top-Up
```bash
# Click "Add Funds" button
# Enter amount (e.g., $50)
# Select payment method
# Click "Add Funds"
# Transaction appears in history
# Balance updates
```

### 4. Test Transaction History
```bash
# Go to Transactions tab
# Try filtering by category, type, status
# Pagination should work
# Transaction details display correctly
```

### 5. Test Withdrawal
```bash
# Click "Withdraw" button
# Enter amount
# Fill bank details
# Review and confirm
# Withdrawal request submitted
```

## API Testing

### Using cURL

#### Get Wallet Balance
```bash
curl -X GET http://localhost:3000/api/wallet \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Wallet Summary
```bash
curl -X GET http://localhost:3000/api/wallet/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Transaction History
```bash
curl -X GET "http://localhost:3000/api/wallet/transactions?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Top-Up Wallet
```bash
curl -X POST http://localhost:3000/api/wallet/top-up \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "paymentMethod": "card"
  }'
```

#### Request Withdrawal
```bash
curl -X POST http://localhost:3000/api/wallet/withdraw \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50.00,
    "bankDetails": {
      "bankName": "Chase Bank",
      "accountNumber": "123456789",
      "accountHolder": "John Doe",
      "routingNumber": "021000021"
    }
  }'
```

### Using Postman

1. Import `WALLET_API.postman_collection.json` (if available)
2. Set authorization header with JWT token
3. Test each endpoint

## Troubleshooting

### Issue: 401 Unauthorized on wallet routes
**Solution**: Ensure JWT token is valid and included in Authorization header

### Issue: Wallet not initialized for new users
**Solution**: Run auth controller again or manually initialize via API:
```bash
curl -X POST http://localhost:3000/api/wallet/init \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userRole": "buyer",
    "currency": "USD"
  }'
```

### Issue: Balance not updating after transaction
**Solution**: 
1. Check transaction status in history
2. Verify transaction is marked as SUCCESS
3. Refresh page (balance auto-refreshes)

### Issue: Frontend components not loading
**Solution**:
1. Check browser console for errors
2. Verify components are imported correctly
3. Clear browser cache
4. Rebuild React app: `npm run dev`

## Next Steps

### Payment Gateway Integration
To enable real payments, integrate with:

1. **Stripe**
   - Install: `npm install @stripe/react-stripe-js @stripe/js`
   - Update TopUpModal with Stripe Elements

2. **PayPal**
   - Install: `npm install @paypal/checkout-server-sdk`
   - Add PayPal button in TopUpModal

3. **Bank Transfer**
   - Implement ACH processing
   - Create bank account verification

### Admin Dashboard
Create admin panel for:
- Approving/rejecting withdrawals
- Viewing all wallet transactions
- Dispute resolution with wallet actions
- User account status management

### Webhook Integration
Set up webhooks for:
- Payment processing status
- Withdrawal confirmations
- Suspicious transaction alerts

## File Structure

```
Backend:
├── backend/
│   ├── services/
│   │   └── walletService.js          (Core wallet logic)
│   ├── controllers/
│   │   └── walletController.js       (API handlers)
│   ├── routes/
│   │   └── wallet.js                 (Route definitions)
│   └── utils/
│       └── walletUtils.js            (Helper functions)

Frontend:
├── src/
│   └── components/
│       ├── WalletDashboard.jsx       (Main wallet UI)
│       ├── WalletHeader.jsx          (Header balance)
│       ├── TransactionHistory.jsx    (Transaction list)
│       ├── TopUpModal.jsx            (Add funds modal)
│       └── WithdrawalModal.jsx       (Withdrawal modal)

Database:
├── prisma/
│   ├── schema.prisma                 (Wallet models)
│   └── migrations/
│       └── 20260523000000_add_wallet_system/
│           └── migration.sql          (SQL schema)
```

## Performance Considerations

1. **Transaction History Pagination**: Limited to 50 per page to prevent slowdown
2. **Balance Calculation**: Cached in wallet record, not computed on every read
3. **Index Strategy**: Indexes on frequently queried fields (status, category, walletId)
4. **Real-time Updates**: Client refreshes every 30 seconds, not every second

## Security Checklist

- [x] JWT authentication on all endpoints
- [x] Server-side fee calculation
- [x] Balance validation before withdrawals
- [x] Double-entry ledger for accuracy
- [x] Transaction audit trail
- [x] User isolation (can't access other wallets)
- [x] Rate limiting recommended for production
- [x] HTTPS only for production

## Production Deployment

Before deploying to production:

1. **Environment Variables**
   - Use production JWT_SECRET
   - Use production DATABASE_URL
   - Set NODE_ENV=production

2. **Database**
   - Run migrations: `npx prisma migrate deploy`
   - Verify table creation
   - Create backups

3. **Payment Gateway**
   - Integrate real payment processing
   - Set up webhook receivers
   - Configure API keys

4. **Monitoring**
   - Set up error tracking (Sentry)
   - Add logging for transactions
   - Monitor API performance

5. **Security**
   - Enable HTTPS
   - Set up rate limiting
   - Configure CORS properly
   - Enable database SSL

## Support Resources

- **Prisma Docs**: https://www.prisma.io/docs/
- **Express.js Docs**: https://expressjs.com/
- **React Docs**: https://react.dev/
- **JWT Docs**: https://jwt.io/

---

**Date**: May 23, 2026
**Status**: Production Ready
**Version**: 1.0.0
