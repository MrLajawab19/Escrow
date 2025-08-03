# Admin Dashboard Testing Guide

## 🎯 Overview

The admin dashboard provides comprehensive dispute management capabilities for administrators to oversee and resolve disputes in the escrow platform.

## 🔐 Admin Authentication

### Default Admin Credentials
- **Email**: `admin@escrowx.com`
- **Password**: `admin123`

### Login Methods

#### 1. API Login
```bash
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@escrowx.com",
    "password": "admin123"
  }'
```

#### 2. Frontend Login
Navigate to `/admin/login` in your browser and use the credentials above.

## 🧪 Testing Methods

### Method 1: Automated Testing
Run the comprehensive test script:
```bash
node test-admin-dashboard.js
```

### Method 2: Manual API Testing
Use these curl commands to test individual endpoints:

#### Get All Disputes
```bash
curl -X GET http://localhost:3000/api/disputes \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Get Dispute Statistics
```bash
curl -X GET http://localhost:3000/api/disputes/stats/overview \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Update Dispute Status
```bash
curl -X PATCH http://localhost:3000/api/disputes/DISPUTE_ID/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "UNDER_REVIEW",
    "notes": "Admin is reviewing this dispute"
  }'
```

#### Resolve Dispute
```bash
curl -X PATCH http://localhost:3000/api/disputes/DISPUTE_ID/resolve \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resolution": "REFUND_BUYER",
    "resolutionAmount": 299,
    "resolutionNotes": "Dispute resolved in favor of buyer",
    "resolvedBy": "admin"
  }'
```

### Method 3: Frontend Testing
1. Start the frontend: `npm run dev`
2. Navigate to `/admin/login`
3. Login with admin credentials
4. Access the admin dashboard components

## 📊 Admin Dashboard Features

### 1. Dispute Overview
- **Total Disputes**: Count of all disputes
- **Open Disputes**: Disputes with OPEN status
- **Under Review**: Disputes being reviewed
- **Resolved**: Successfully resolved disputes

### 2. Dispute Management
- **View All Disputes**: Complete list with details
- **Filter by Status**: OPEN, UNDER_REVIEW, RESOLVED
- **Filter by Priority**: HIGH, MEDIUM, LOW
- **Search by Order ID**: Quick dispute lookup

### 3. Dispute Actions
- **Update Status**: Change dispute status
- **Add Notes**: Internal admin notes
- **Resolve Dispute**: Final resolution with outcome
- **View Evidence**: Access uploaded files
- **View Timeline**: Complete dispute history

### 4. Resolution Options
- **REFUND_BUYER**: Full refund to buyer
- **RELEASE_TO_SELLER**: Release funds to seller
- **PARTIAL_REFUND**: Partial refund to buyer
- **CONTINUE_WORK**: Allow work to continue
- **CANCEL_ORDER**: Cancel the entire order

## 🔧 Testing Scenarios

### Scenario 1: Basic Admin Login
1. Login with admin credentials
2. Verify token is received
3. Check admin permissions

### Scenario 2: View Disputes
1. Login as admin
2. Fetch all disputes
3. Verify dispute data structure
4. Check dispute statistics

### Scenario 3: Dispute Resolution Flow
1. Create a test dispute (as buyer)
2. Login as admin
3. Update dispute status to UNDER_REVIEW
4. Add resolution notes
5. Resolve dispute with outcome
6. Verify order status updates

### Scenario 4: Evidence Management
1. Create dispute with evidence
2. Login as admin
3. View uploaded evidence
4. Add admin notes
5. Verify timeline updates

## 🐛 Common Issues & Solutions

### Issue 1: "User not found" Error
**Cause**: Admin user not in database
**Solution**: Admin authentication uses JWT token directly, not database lookup

### Issue 2: "Admin access required" Error
**Cause**: Using regular user token instead of admin token
**Solution**: Use admin login endpoint to get proper admin token

### Issue 3: "Failed to fetch disputes" Error
**Cause**: Authentication middleware issue
**Solution**: Ensure admin token is properly formatted and valid

### Issue 4: Dispute not found
**Cause**: Dispute ID doesn't exist
**Solution**: Create test dispute first, then use that ID

## 📈 Expected Test Results

### Successful Admin Login
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin-mock-id",
    "email": "admin@escrowx.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }
}
```

### Dispute Statistics
```json
{
  "success": true,
  "data": {
    "total": 5,
    "open": 2,
    "resolved": 2,
    "underReview": 1
  }
}
```

### Dispute List
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orderId": "uuid",
      "raisedBy": "buyer",
      "reason": "Quality Issue",
      "status": "OPEN",
      "priority": "HIGH",
      "createdAt": "2025-08-03T10:00:00.000Z"
    }
  ]
}
```

## 🚀 Advanced Testing

### Load Testing
```bash
# Test multiple admin operations
for i in {1..10}; do
  node test-admin-dashboard.js
done
```

### Security Testing
```bash
# Test unauthorized access
curl -X GET http://localhost:3000/api/disputes \
  -H "Authorization: Bearer INVALID_TOKEN"
```

### Integration Testing
```bash
# Test complete workflow
node test-end-to-end.js
```

## 📝 Testing Checklist

- [ ] Admin login works
- [ ] Can view all disputes
- [ ] Can view dispute statistics
- [ ] Can update dispute status
- [ ] Can resolve disputes
- [ ] Can view dispute details
- [ ] Can add evidence to disputes
- [ ] Timeline updates correctly
- [ ] Order status updates after resolution
- [ ] Error handling works properly
- [ ] Security restrictions enforced

## 🎯 Success Criteria

✅ **Admin Authentication**: Login with admin credentials  
✅ **Dispute Management**: View and manage all disputes  
✅ **Status Updates**: Change dispute status with notes  
✅ **Resolution System**: Resolve disputes with outcomes  
✅ **Statistics**: Real-time dispute statistics  
✅ **Security**: Proper access control and validation  
✅ **Error Handling**: Graceful error responses  
✅ **Integration**: Works with existing dispute system  

## 🔄 Continuous Testing

For ongoing testing, run:
```bash
# Automated test suite
node test-admin-dashboard.js

# Manual testing
npm run dev
# Then visit http://localhost:5173/admin/login
```

---

**Status**: ✅ Fully Functional  
**Last Updated**: August 2025  
**Version**: 1.0.0 