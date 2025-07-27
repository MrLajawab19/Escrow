# EscrowX Order Management API Documentation

## Base URL
```
http://localhost:3000/api/orders
```

## Authentication
Currently using simple user ID validation. In production, implement JWT tokens.

## Order Status Flow
```
PLACED → ESCROW_FUNDED → IN_PROGRESS → SUBMITTED → APPROVED → RELEASED
    ↓         ↓              ↓            ↓           ↓
  DISPUTED → IN_PROGRESS → SUBMITTED → APPROVED → RELEASED/REFUNDED
```

## API Endpoints

### 1. Create Order
**POST** `/api/orders`

**Request Body:**
```json
{
  "buyerId": "uuid",
  "sellerId": "uuid",
  "scopeBox": {
    "title": "Logo Design Project",
    "description": "Create a modern logo for tech startup",
    "deliverables": ["Logo in PNG", "Logo in SVG", "Brand guidelines"],
    "deadline": "2024-02-15T00:00:00.000Z",
    "price": 500
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "buyerId": "uuid",
    "sellerId": "uuid",
    "scopeBox": {...},
    "status": "PLACED",
    "orderLogs": [...],
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "message": "Order created successfully"
}
```

### 2. Fund Escrow
**POST** `/api/orders/:id/fund-escrow`

**Request Body:**
```json
{
  "buyerId": "uuid"
}
```

### 3. Start Work
**PATCH** `/api/orders/:id/start`

**Request Body:**
```json
{
  "sellerId": "uuid"
}
```

### 4. Submit Delivery
**PATCH** `/api/orders/:id/submit`

**Request Body:**
```json
{
  "sellerId": "uuid",
  "deliveryFiles": ["file1.pdf", "file2.png"]
}
```

### 5. Approve Delivery
**PATCH** `/api/orders/:id/approve`

**Request Body:**
```json
{
  "buyerId": "uuid"
}
```

### 6. Raise Dispute
**PATCH** `/api/orders/:id/dispute`

**Request Body:**
```json
{
  "userId": "uuid",
  "disputeData": {
    "reason": "Quality issues",
    "description": "Logo doesn't match requirements",
    "evidence": ["screenshot1.png"]
  }
}
```

### 7. Release Funds (Admin)
**PATCH** `/api/orders/:id/release`

**Request Body:**
```json
{
  "adminId": "uuid"
}
```

### 8. Refund Buyer (Admin)
**PATCH** `/api/orders/:id/refund`

**Request Body:**
```json
{
  "adminId": "uuid"
}
```

### 9. Get Order
**GET** `/api/orders/:id`

### 10. Get User Orders
**GET** `/api/orders/user/:userId?role=buyer|seller`

## Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Missing required fields: buyerId, sellerId, scopeBox"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Order not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Invalid status transition from PLACED to RELEASED"
}
```

## Order Logs Structure
```json
{
  "event": "STATUS_CHANGED_TO_ESCROW_FUNDED",
  "byUserId": "uuid",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "previousStatus": "PLACED",
  "newStatus": "ESCROW_FUNDED",
  "additionalData": {...}
}
```

## Testing Examples

### Create and Fund an Order
```bash
# 1. Create order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "550e8400-e29b-41d4-a716-446655440000",
    "sellerId": "550e8400-e29b-41d4-a716-446655440001",
    "scopeBox": {
      "title": "Website Design",
      "description": "Modern responsive website",
      "deliverables": ["HTML/CSS", "JavaScript", "Mobile responsive"],
      "deadline": "2024-02-15T00:00:00.000Z",
      "price": 1000
    }
  }'

# 2. Fund escrow
curl -X POST http://localhost:3000/api/orders/{orderId}/fund-escrow \
  -H "Content-Type: application/json" \
  -d '{"buyerId": "550e8400-e29b-41d4-a716-446655440000"}'
``` 