// Modern Seller Dashboard JavaScript - Vector Style UI
let currentSeller = null;
let incomingRequests = [];
let acceptedOrders = [];
let currentRequest = null;
let countdownIntervals = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
  // Load order history
  loadOrderHistory();
  
  // Check if seller is already registered
  const savedSeller = localStorage.getItem('escrowx_seller');
  if (savedSeller) {
    currentSeller = JSON.parse(savedSeller);
    populateSellerFields();
    showDashboard();
  }
});

// Register seller
function registerSeller() {
  const email = document.getElementById('sellerEmail').value.trim();
  const phone = document.getElementById('sellerPhone').value.trim();
  
  if (!email && !phone) {
    alert('Please enter either email or phone number');
    return;
  }
  
  if (email && !isValidEmail(email)) {
    alert('Please enter a valid email address');
    return;
  }
  
  if (phone && !isValidPhone(phone)) {
    alert('Please enter a valid phone number');
    return;
  }
  
  currentSeller = {
    email: email,
    phone: phone,
    registeredAt: new Date().toISOString()
  };
  
  // Save to localStorage
  localStorage.setItem('escrowx_seller', JSON.stringify(currentSeller));
  
  // Show success message
  showToast('Seller registered successfully!');
  
  // Show dashboard
  showDashboard();
  
  // Simulate incoming request (for demo)
  setTimeout(() => {
    simulateIncomingRequest();
  }, 2000);
}

// Populate seller fields
function populateSellerFields() {
  if (currentSeller) {
    document.getElementById('sellerEmail').value = currentSeller.email || '';
    document.getElementById('sellerPhone').value = currentSeller.phone || '';
  }
}

// Show dashboard after registration
function showDashboard() {
  document.getElementById('incomingRequests').classList.remove('hidden');
  document.getElementById('acceptedOrders').classList.remove('hidden');
  
  // Load requests
  loadIncomingRequests();
  loadAcceptedOrders();
}

// Simulate incoming request (for demo)
function simulateIncomingRequest() {
  const demoRequest = {
    id: 'req_' + Math.random().toString(36).substr(2, 9),
    buyerName: 'John Doe',
    productType: 'Logo Design',
    description: 'Need a modern logo for my tech startup. Looking for something clean and professional.',
    qualityConditions: 'Must be vector format, include source files, and provide 3 variations.',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    price: '₹2500',
    currency: 'INR',
    platform: 'Fiverr',
    platformLink: 'https://fiverr.com/example',
    attachments: ['logo_brief.pdf', 'brand_guidelines.docx'],
    status: 'pending',
    createdAt: new Date().toISOString(),
    isNew: true
  };
  
  incomingRequests.unshift(demoRequest);
  renderIncomingRequests();
  
  // Show notification
  showToast('New scope request received!');
}

// Load incoming requests
function loadIncomingRequests() {
  // In a real app, this would fetch from the backend
  renderIncomingRequests();
}

// Render incoming requests
function renderIncomingRequests() {
  const requestsList = document.getElementById('scopeRequestsList');
  
  if (incomingRequests.length === 0) {
    requestsList.innerHTML = `
      <div class="info-message">
        <p>📭 No incoming scope requests yet. They will appear here when buyers send them.</p>
      </div>
    `;
    return;
  }
  
  requestsList.innerHTML = incomingRequests.map(request => `
    <div class="request-card ${request.isNew ? 'new' : ''}" onclick="viewScopeRequest('${request.id}')">
      <div class="request-header">
        <h3 class="request-title">${request.productType}</h3>
        <div class="request-meta">
          <span class="request-price">${request.price}</span>
          <span class="request-deadline">Due: ${new Date(request.deadline).toLocaleDateString()}</span>
          <div class="status-badge status-pending">Pending</div>
          ${request.isNew ? '<span class="change-tag">NEW</span>' : ''}
        </div>
      </div>
      <div class="request-description">${request.description.substring(0, 100)}${request.description.length > 100 ? '...' : ''}</div>
      <div class="request-actions">
        <button class="btn btn-outline btn-small" onclick="event.stopPropagation(); viewScopeRequest('${request.id}')">View Details</button>
      </div>
    </div>
  `).join('');
}

// View scope request
function viewScopeRequest(requestId) {
  currentRequest = incomingRequests.find(req => req.id === requestId);
  if (!currentRequest) return;
  
  // Mark as viewed
  currentRequest.isNew = false;
  
  const modal = document.getElementById('scopeRequestModal');
  const content = document.getElementById('scopeRequestContent');
  
  content.innerHTML = `
    <div class="flex flex-col gap-3">
      <div class="change-tracked">
        <strong>Buyer:</strong> ${currentRequest.buyerName}
        <span class="change-tag">From ${currentRequest.platform}</span>
      </div>
      
      <div class="change-tracked">
        <strong>Product Type:</strong> ${currentRequest.productType}
      </div>
      
      <div class="change-tracked">
        <strong>Description:</strong> ${currentRequest.description}
      </div>
      
      <div class="change-tracked">
        <strong>Quality Conditions:</strong> ${currentRequest.qualityConditions}
      </div>
      
      <div class="change-tracked">
        <strong>Deadline:</strong> ${new Date(currentRequest.deadline).toLocaleString()}
      </div>
      
      <div class="change-tracked">
        <strong>Price:</strong> ${currentRequest.price}
      </div>
      
      ${currentRequest.attachments.length > 0 ? `
        <div class="change-tracked">
          <strong>Attachments:</strong>
          <div class="file-list">
            ${currentRequest.attachments.map(file => `
              <div class="file-item">
                <div class="file-info">
                  <span class="file-icon">📎</span>
                  <div class="file-name">${file}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
  
  modal.classList.add('active');
}

// Close scope request modal
function closeScopeRequest() {
  const modal = document.getElementById('scopeRequestModal');
  modal.classList.remove('active');
  currentRequest = null;
}

// Request changes
function requestChanges() {
  if (!currentRequest) return;
  
  closeScopeRequest();
  
  // Populate edit form
  const editForm = document.getElementById('editScopeForm');
  editForm.querySelector('select[name="productType"]').value = currentRequest.productType;
  editForm.querySelector('input[name="productLink"]').value = currentRequest.platformLink || '';
  editForm.querySelector('textarea[name="description"]').value = currentRequest.description;
  editForm.querySelector('textarea[name="qualityConditions"]').value = currentRequest.qualityConditions;
  editForm.querySelector('input[name="deadline"]').value = currentRequest.deadline.slice(0, 16);
  
  // Show edit modal
  document.getElementById('editScopeModal').classList.add('active');
}

// Close edit scope modal
function closeEditScope() {
  const modal = document.getElementById('editScopeModal');
  modal.classList.remove('active');
}

// Handle edit form submission
document.getElementById('editScopeForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  if (!currentRequest) return;
  
  const formData = new FormData(this);
  
  // Update request with changes
  currentRequest.productType = formData.get('productType');
  currentRequest.description = formData.get('description');
  currentRequest.qualityConditions = formData.get('qualityConditions');
  currentRequest.deadline = formData.get('deadline');
  currentRequest.status = 'waiting';
  currentRequest.changedBy = 'seller';
  currentRequest.changedAt = new Date().toISOString();
  
  // Close modal
  closeEditScope();
  
  // Show success message
  showToast('Changes sent to buyer successfully!');
  
  // Update UI
  renderIncomingRequests();
});

// Accept scope
function acceptScope() {
  if (!currentRequest) return;
  
  // Move to accepted orders
  currentRequest.status = 'accepted';
  currentRequest.acceptedAt = new Date().toISOString();
  
  acceptedOrders.unshift(currentRequest);
  
  // Remove from incoming requests
  incomingRequests = incomingRequests.filter(req => req.id !== currentRequest.id);
  
  // Close modal
  closeScopeRequest();
  
  // Show success message
  showToast('Scope accepted! Order moved to accepted orders.');
  
  // Update UI
  renderIncomingRequests();
  renderAcceptedOrders();
}

// Load accepted orders
function loadAcceptedOrders() {
  renderAcceptedOrders();
}

// Render accepted orders
function renderAcceptedOrders() {
  const ordersList = document.getElementById('acceptedOrdersList');
  
  if (acceptedOrders.length === 0) {
    ordersList.innerHTML = `
      <div class="info-message">
        <p>📋 No accepted orders yet. Accepted scope requests will appear here.</p>
      </div>
    `;
    return;
  }
  
  ordersList.innerHTML = acceptedOrders.map(order => `
    <div class="request-card" onclick="viewOrderDetails('${order.id}')">
      <div class="request-header">
        <h3 class="request-title">${order.productType}</h3>
        <div class="request-meta">
          <span class="request-price">${order.price}</span>
          <div class="status-badge status-accepted">Accepted</div>
        </div>
      </div>
      <div class="request-description">${order.description.substring(0, 100)}${order.description.length > 100 ? '...' : ''}</div>
      <div class="request-actions">
        <button class="btn btn-outline btn-small" onclick="event.stopPropagation(); viewOrderDetails('${order.id}')">View Details</button>
        <button class="btn btn-success btn-small" onclick="event.stopPropagation(); markServiceDelivered('${order.id}')">📦 Mark Delivered</button>
      </div>
    </div>
  `).join('');
}

// View order details
function viewOrderDetails(orderId) {
  const order = acceptedOrders.find(ord => ord.id === orderId);
  if (!order) return;
  
  const modal = document.getElementById('orderDetailsModal');
  const content = document.getElementById('orderDetailsContent');
  
  // Calculate time remaining
  const deadline = new Date(order.deadline);
  const now = new Date();
  const timeRemaining = deadline - now;
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  
  content.innerHTML = `
    <div class="flex flex-col gap-3">
      <div class="summary-header">
        <h3>Order Details</h3>
        <div class="timer">
          <span class="timer-icon">⏰</span>
          <span>${hours}h ${minutes}m remaining</span>
        </div>
      </div>
      
      <div class="change-tracked">
        <strong>Buyer:</strong> ${order.buyerName}
      </div>
      
      <div class="change-tracked">
        <strong>Product Type:</strong> ${order.productType}
      </div>
      
      <div class="change-tracked">
        <strong>Description:</strong> ${order.description}
      </div>
      
      <div class="change-tracked">
        <strong>Quality Conditions:</strong> ${order.qualityConditions}
      </div>
      
      <div class="change-tracked">
        <strong>Deadline:</strong> ${new Date(order.deadline).toLocaleString()}
      </div>
      
      <div class="change-tracked">
        <strong>Price:</strong> ${order.price}
      </div>
      
      <div class="change-tracked">
        <strong>Accepted:</strong> ${new Date(order.acceptedAt).toLocaleString()}
      </div>
      
      ${order.changedBy ? `
        <div class="change-tracked">
          <strong>Last Modified:</strong> ${order.changedBy} on ${new Date(order.changedAt).toLocaleString()}
        </div>
      ` : ''}
    </div>
  `;
  
  modal.classList.add('active');
}

// Close order details modal
function closeOrderDetails() {
  const modal = document.getElementById('orderDetailsModal');
  modal.classList.remove('active');
}

// Mark service as delivered
function markServiceDelivered(orderId) {
  const order = acceptedOrders.find(ord => ord.id === orderId);
  if (!order) return;
  
  if (confirm('Are you sure you want to mark this service as delivered?')) {
    order.status = 'delivered';
    order.deliveredAt = new Date().toISOString();
    
    // Show success message
    showToast('Service marked as delivered!');
    
    // Update UI
    renderAcceptedOrders();
  }
}

// Print receipt
function printReceipt() {
  const receiptContent = `
    <html>
      <head>
        <title>EscrowX Order Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px; }
          .details { margin-bottom: 20px; }
          .detail-row { margin: 10px 0; }
          .label { font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>EscrowX Order Receipt</h1>
          <p>Seller: ${currentSeller?.email || currentSeller?.phone}</p>
          <p>Date: ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="details">
          <div class="detail-row"><span class="label">Product Type:</span> ${currentRequest?.productType || 'N/A'}</div>
          <div class="detail-row"><span class="label">Price:</span> ${currentRequest?.price || 'N/A'}</div>
          <div class="detail-row"><span class="label">Deadline:</span> ${currentRequest?.deadline ? new Date(currentRequest.deadline).toLocaleString() : 'N/A'}</div>
          <div class="detail-row"><span class="label">Description:</span> ${currentRequest?.description || 'N/A'}</div>
        </div>
        <div class="footer">
          <p>Thank you for using EscrowX!</p>
          <p>This receipt serves as proof of your escrow transaction.</p>
        </div>
      </body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(receiptContent);
  printWindow.document.close();
  printWindow.print();
}

// Load order history
function loadOrderHistory() {
  const orderHistoryList = document.getElementById('orderHistoryList');
  
  // Simulate order history data
  const history = [
    {
      id: 'ORD001',
      type: 'Logo Design',
      amount: '₹2500',
      status: 'Completed',
      date: '2024-01-15',
      buyer: 'John Doe'
    },
    {
      id: 'ORD002',
      type: 'Account Selling',
      amount: '₹5000',
      status: 'In Progress',
      date: '2024-01-20',
      buyer: 'Jane Smith'
    }
  ];
  
  orderHistoryList.innerHTML = history.map(order => `
    <div class="request-card">
      <div class="request-header">
        <h3 class="request-title">${order.type}</h3>
        <div class="request-meta">
          <span class="request-price">${order.amount}</span>
          <div class="status-badge ${order.status === 'Completed' ? 'status-accepted' : 'status-pending'}">
            ${order.status}
          </div>
        </div>
      </div>
      <div class="request-description">
        <strong>Buyer:</strong> ${order.buyer} | <strong>Date:</strong> ${order.date}
      </div>
    </div>
  `).join('');
}

// Validation functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Show toast notification
function showToast(message) {
  // Create toast element
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--primary-green);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;
  toast.textContent = message;
  
  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(toast);
  
  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.remove();
    style.remove();
  }, 3000);
}

// Chat functionality
function toggleChat() {
  const chatBox = document.getElementById('chatBox');
  chatBox.classList.toggle('active');
}

function handleChatInput(event) {
  if (event.key === 'Enter') {
    const input = event.target;
    const message = input.value.trim();
    
    if (message) {
      const chatMessages = document.querySelector('.chat-messages');
      chatMessages.innerHTML += `<p><strong>You:</strong> ${message}</p>`;
      
      // Simulate bot response
      setTimeout(() => {
        chatMessages.innerHTML += `<p><strong>EscrowX Bot:</strong> Thank you for your message. A support representative will get back to you soon.</p>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 1000);
      
      input.value = '';
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
}

// Close modals when clicking outside
document.getElementById('scopeRequestModal').addEventListener('click', function(e) {
  if (e.target === this) {
    closeScopeRequest();
  }
});

document.getElementById('editScopeModal').addEventListener('click', function(e) {
  if (e.target === this) {
    closeEditScope();
  }
});

document.getElementById('orderDetailsModal').addEventListener('click', function(e) {
  if (e.target === this) {
    closeOrderDetails();
  }
}); 