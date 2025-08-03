# 🧪 Mock Orders Testing Guide

## 📋 Current Mock Orders Status

You have **4 mock orders** with different statuses for testing all functionality:

### 1. 🟡 **Modern Logo Design** - `ESCROW_FUNDED`
- **Buyer:** John Smith
- **Status:** Ready for seller action
- **Test Actions:**
  - ✅ **Accept Order** (seller)
  - ✅ **Reject Order** (seller) 
  - ✅ **Request Changes** (seller)

### 2. 🟢 **E-commerce Website** - `SUBMITTED`
- **Buyer:** Sarah Johnson
- **Status:** Ready for buyer to release funds
- **Test Actions:**
  - ✅ **Release Funds** (buyer)
  - ✅ **Raise Dispute** (buyer)

### 3. 🔴 **Blog Content Writing** - `DISPUTED`
- **Buyer:** Mike Wilson
- **Status:** Has an active dispute
- **Test Actions:**
  - ✅ **View Dispute Details** (buyer/seller)
  - ✅ **Resolve Dispute** (admin)

### 4. 🟠 **Social Media Graphics** - `IN_PROGRESS`
- **Buyer:** Emily Davis
- **Status:** Seller is working on the project
- **Test Actions:**
  - ✅ **Order Delivered** (seller)

---

## 🚀 How to Test Functionality

### **Step 1: Login to Dashboards**
```bash
# Buyer Dashboard
Email: buyer@example.com
Password: password

# Seller Dashboard  
Email: seller@example.com
Password: password
```

### **Step 2: Test Different Actions**

#### **For Sellers:**
1. **Accept/Reject/Request Changes** (ESCROW_FUNDED orders)
2. **Submit Delivery** (IN_PROGRESS orders)

#### **For Buyers:**
1. **Release Funds** (SUBMITTED orders)
2. **Review Changes** (CHANGES_REQUESTED orders)
3. **Raise Dispute** (SUBMITTED orders)

#### **For Admins:**
1. **Resolve Disputes** (DISPUTED orders)

---

## 🔄 How to Revert After Testing

### **Option 1: Quick Revert Script**
```bash
node revert-mock-orders.js
```

This will reset all orders to their original states:
- ✅ ESCROW_FUNDED → Ready for seller actions
- ✅ SUBMITTED → Ready for buyer to release funds  
- ✅ DISPUTED → Has active dispute
- ✅ IN_PROGRESS → Seller working on project

### **Option 2: Check Current Status**
```bash
node check-order-status.js
```

This shows you the current status of all orders.

### **Option 3: Complete Reset**
If you want to completely reset the database:
```bash
node cleanup-and-add-mock-orders.js
```

---

## 📊 Testing Scenarios

### **Scenario 1: Test Seller Actions**
1. Login as seller
2. Go to "View Requests"
3. Test Accept/Reject/Request Changes on "Modern Logo Design"
4. Run `node revert-mock-orders.js` to reset

### **Scenario 2: Test Buyer Actions**  
1. Login as buyer
2. Test "Release Funds" on "E-commerce Website"
3. Run `node revert-mock-orders.js` to reset

### **Scenario 3: Test Dispute Resolution**
1. Login as admin
2. Test dispute resolution on "Blog Content Writing"
3. Run `node revert-mock-orders.js` to reset

### **Scenario 4: Test Order Delivery**
1. Login as seller
2. Test "Order Delivered" on "Social Media Graphics"
3. Run `node revert-mock-orders.js` to reset

---

## 🛠️ Available Scripts

| Script | Purpose |
|--------|---------|
| `node check-order-status.js` | Check current order statuses |
| `node revert-mock-orders.js` | Reset orders to original states |
| `node cleanup-and-add-mock-orders.js` | Complete database reset |

---

## 🎯 Quick Testing Workflow

1. **Test a feature** (e.g., release funds)
2. **Verify it works** (check status changes)
3. **Revert the order** (`node revert-mock-orders.js`)
4. **Test another feature** (repeat)

This way you can test all functionality without losing your mock data!

---

## 📝 Notes

- ✅ **Mock orders are persistent** - they won't disappear after testing
- ✅ **Easy revert** - one command resets everything
- ✅ **All action buttons** - every status shows appropriate buttons
- ✅ **Real data** - orders are in the actual database

Happy testing! 🎉 