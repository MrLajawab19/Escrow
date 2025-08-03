# Dispute Resolution Guide

## 🎯 Overview

The dispute resolution system provides a comprehensive workflow for handling conflicts between buyers and sellers in the escrow platform. This guide explains how disputes are created, managed, and resolved.

## 🔄 Dispute Resolution Flow

### 1. **Dispute Creation**
- **Trigger**: Buyer or seller raises a dispute
- **Requirements**: Order ID, reason, description
- **Status**: Automatically set to `OPEN`
- **Timeline**: Initial entry created

```javascript
// Example: Buyer raises dispute
POST /api/disputes
{
  "orderId": "uuid",
  "reason": "Quality Issue",
  "description": "Work doesn't meet requirements",
  "requestedResolution": "Refund full amount",
  "priority": "HIGH"
}
```

### 2. **Dispute Review**
- **Admin Action**: Review dispute details
- **Status Update**: Change to `UNDER_REVIEW`
- **Timeline**: Add review entry

```javascript
// Example: Admin updates status
PATCH /api/disputes/{id}/status
{
  "status": "UNDER_REVIEW",
  "notes": "Admin is reviewing evidence"
}
```

### 3. **Evidence Management**
- **File Upload**: Support for images, PDFs, documents
- **Timeline Tracking**: Each evidence addition logged
- **Multiple Files**: Up to 5 files per submission

```javascript
// Example: Add evidence
POST /api/disputes/{id}/evidence
FormData: {
  "description": "Screenshots of delivered work",
  "evidence": [files]
}
```

### 4. **Dispute Resolution**
- **Admin Decision**: Final resolution by admin
- **Resolution Types**: Multiple outcome options
- **Order Update**: Automatic order status change

```javascript
// Example: Resolve dispute
PATCH /api/disputes/{id}/resolve
{
  "resolution": "REFUND_BUYER",
  "resolutionAmount": 299,
  "resolutionNotes": "Dispute resolved in favor of buyer",
  "resolvedBy": "admin"
}
```

## 📊 Resolution Options

### **REFUND_BUYER**
- **Action**: Full refund to buyer
- **Order Status**: `CANCELLED`
- **Use Case**: Work doesn't meet requirements

### **RELEASE_TO_SELLER**
- **Action**: Release funds to seller
- **Order Status**: `COMPLETED`
- **Use Case**: Work meets requirements

### **PARTIAL_REFUND**
- **Action**: Partial refund to buyer
- **Order Status**: `CANCELLED`
- **Use Case**: Partial work completed

### **CONTINUE_WORK**
- **Action**: Allow work to continue
- **Order Status**: `IN_PROGRESS`
- **Use Case**: Minor issues to be fixed

### **CANCEL_ORDER**
- **Action**: Cancel entire order
- **Order Status**: `CANCELLED`
- **Use Case**: Fundamental disagreements

## 🔍 Dispute Statuses

### **OPEN**
- Initial status when dispute is created
- Awaiting admin review
- Can accept evidence

### **UNDER_REVIEW**
- Admin is actively reviewing
- Can still accept evidence
- Timeline being updated

### **RESPONDED**
- One party has responded
- Awaiting counter-response
- Evidence still accepted

### **MEDIATION**
- Admin mediation required
- Both parties involved
- Complex resolution needed

### **RESOLVED**
- Final resolution applied
- No further actions
- Order status updated

### **CLOSED**
- Dispute completely closed
- All actions completed
- Historical record only

## 📋 Dispute Reasons

### **Quality Issue**
- Work doesn't meet specifications
- Poor quality deliverables
- Missing requirements

### **Delivery Delay**
- Missed deadlines
- Late delivery
- Timeline violations

### **Payment Issue**
- Payment problems
- Escrow disputes
- Refund requests

### **Communication Problem**
- Poor communication
- Unresponsive parties
- Misunderstandings

### **Scope Creep**
- Additional work requested
- Scope changes
- Extra requirements

### **Technical Issue**
- Platform problems
- System errors
- Technical difficulties

### **Other**
- Miscellaneous issues
- Custom problems
- Unspecified reasons

## 🎯 Priority Levels

### **LOW**
- Minor issues
- Quick resolution expected
- Standard processing

### **MEDIUM**
- Normal priority
- Standard review time
- Typical disputes

### **HIGH**
- Urgent issues
- Fast-track review
- Important disputes

### **URGENT**
- Critical issues
- Immediate attention
- Emergency resolution

## 📈 Timeline Tracking

Every dispute action is logged in the timeline:

```javascript
// Timeline Entry Structure
{
  "event": "DISPUTE_CREATED|STATUS_UPDATED|EVIDENCE_ADDED|DISPUTE_RESOLVED",
  "by": "buyer|seller|admin",
  "timestamp": "2025-08-03T10:00:00.000Z",
  "description": "Human readable description",
  "notes": "Additional details"
}
```

### **Timeline Events**
- `DISPUTE_CREATED`: Initial dispute creation
- `STATUS_UPDATED`: Status change
- `EVIDENCE_ADDED`: New evidence uploaded
- `DISPUTE_RESOLVED`: Final resolution

## 🔐 Admin Authentication

### **Admin Login**
```bash
POST /api/auth/admin/login
{
  "email": "admin@escrowx.com",
  "password": "admin123"
}
```

### **Admin Actions**
- View all disputes
- Update dispute status
- Resolve disputes
- View statistics
- Manage evidence

## 📊 Statistics & Reporting

### **Dispute Statistics**
```javascript
{
  "total": 25,
  "open": 5,
  "underReview": 3,
  "resolved": 17
}
```

### **Resolution Analytics**
- Resolution types distribution
- Average resolution time
- Success rates by reason
- Priority level analysis

## 🧪 Testing Dispute Resolution

### **Automated Testing**
```bash
# Run complete dispute resolution test
node test-dispute-resolution.js
```

### **Manual Testing**
```bash
# Create dispute
curl -X POST http://localhost:3000/api/disputes \
  -H "Authorization: Bearer BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "uuid",
    "reason": "Quality Issue",
    "description": "Test dispute"
  }'

# Admin resolves dispute
curl -X PATCH http://localhost:3000/api/disputes/DISPUTE_ID/resolve \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resolution": "REFUND_BUYER",
    "resolutionAmount": 299,
    "resolutionNotes": "Test resolution"
  }'
```

## 🔧 API Endpoints

### **Dispute Management**
- `POST /api/disputes` - Create dispute
- `GET /api/disputes` - Get all disputes (admin)
- `GET /api/disputes/:id` - Get dispute by ID
- `GET /api/disputes/user/my-disputes` - Get user disputes

### **Dispute Actions**
- `PATCH /api/disputes/:id/status` - Update status
- `PATCH /api/disputes/:id/resolve` - Resolve dispute
- `POST /api/disputes/:id/evidence` - Add evidence

### **Statistics**
- `GET /api/disputes/stats/overview` - Get statistics

## 🎯 Success Criteria

✅ **Dispute Creation**: Users can raise disputes  
✅ **Evidence Upload**: File uploads work correctly  
✅ **Status Updates**: Admin can update status  
✅ **Resolution System**: Admin can resolve disputes  
✅ **Timeline Tracking**: All actions logged  
✅ **Order Integration**: Order status updates  
✅ **Statistics**: Real-time dispute metrics  
✅ **Security**: Proper access control  

## 🔄 Complete Workflow Example

1. **Buyer creates order** → Order status: `PLACED`
2. **Buyer funds escrow** → Order status: `FUNDED`
3. **Seller delivers work** → Order status: `DELIVERED`
4. **Buyer raises dispute** → Order status: `DISPUTED`
5. **Admin reviews dispute** → Dispute status: `UNDER_REVIEW`
6. **Evidence added** → Timeline updated
7. **Admin resolves** → Dispute status: `RESOLVED`
8. **Order updated** → Order status: `CANCELLED` (if refund)

## 🚀 Key Features

- **Transparent Process**: All actions logged
- **Evidence Management**: File upload support
- **Admin Oversight**: Professional dispute handling
- **Status Tracking**: Real-time updates
- **Order Integration**: Automatic status changes
- **Statistics**: Comprehensive reporting
- **Security**: Role-based access control

---

**Status**: ✅ Fully Functional  
**Last Updated**: August 2025  
**Version**: 1.0.0 