# Prisma Schema Setup for EscrowX

## 📋 Schema Overview

Your Prisma schema includes:

### **Enums:**
- `OrderStatus`: PLACED, ESCROW_FUNDED, IN_PROGRESS, SUBMITTED, APPROVED, DISPUTED, RELEASED, REFUNDED
- `DisputeStatus`: OPEN, RESPONDED, RESOLVED  
- `DisputeReason`: QUALITY_ISSUE, DEADLINE_MISSED, FAKE_DELIVERY, INCOMPLETE_WORK, OTHER

### **Models:**
- `Order`: Main order entity with 1:1 relationship to Dispute
- `Dispute`: Dispute entity with strict 1:1 relationship to Order

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Create .env File
Create a `.env` file in your project root:
```env
DATABASE_URL="postgresql://postgres:ayush19$@localhost:5432/escrowx_dev"
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Create Database Tables
```bash
npx prisma migrate dev --name init
```

### 5. (Optional) View Database
```bash
npx prisma studio
```

## 📝 Usage Examples

### Creating an Order
```javascript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const order = await prisma.order.create({
  data: {
    buyerId: 'user-123',
    sellerId: 'seller-456',
    scopeBox: {
      title: 'Logo Design',
      description: 'Create modern logo',
      deliverables: ['PNG', 'SVG'],
      deadline: '2024-02-15',
      price: 500
    },
    status: 'PLACED',
    deliveryFiles: [],
    orderLogs: []
  }
})
```

### Creating a Dispute
```javascript
const dispute = await prisma.dispute.create({
  data: {
    orderId: order.id,
    userId: 'user-123',
    reason: 'QUALITY_ISSUE',
    description: 'Logo quality is poor',
    evidenceUrls: ['evidence1.jpg', 'evidence2.png'],
    requestedResolution: 'REFUND',
    status: 'OPEN'
  }
})
```

### Querying with Relations
```javascript
const orderWithDispute = await prisma.order.findUnique({
  where: { id: orderId },
  include: { dispute: true }
})
```

## 🔄 Migration Commands

- **Create migration**: `npx prisma migrate dev --name <migration-name>`
- **Apply migrations**: `npx prisma migrate deploy`
- **Reset database**: `npx prisma migrate reset`
- **View migration history**: `npx prisma migrate status`

## 🛠 Development

- **Open Prisma Studio**: `npx prisma studio`
- **Format schema**: `npx prisma format`
- **Validate schema**: `npx prisma validate` 