// Modern Seller Dashboard JavaScript
let currentSeller = '';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
  loadSampleData();
});

// Load incoming requests
function loadIncomingRequests() {
  currentSeller = document.getElementById('sellerName').value.trim();
  
  if (!currentSeller) {
    alert('Please enter your name first');
    return;
  }
  
  // Simulate loading incoming scope requests
  const scopeRequestsList = document.getElementById('scopeRequestsList');
  
  const requests = [
    {
      id: 'SR001',
      buyer: 'Alice Johnson',
      productType: 'Logo Design',
      description: 'Need a modern logo for my tech startup',
      price: '$200',
      deadline: '2024-02-15',
      status: 'Pending'
    },
    {
      id: 'SR002',
      buyer: 'Bob Smith',
      productType: 'Website Development',
      description: 'E-commerce website with payment integration',
      price: '$800',
      deadline: '2024-02-20',
      status: 'Pending'
    }
  ];
  
  scopeRequestsList.innerHTML = requests.map(request => `
    <div class="dashboard-card" style="margin-bottom: 1rem;">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h3>${request.productType}</h3>
          <p class="text-muted">Request ID: ${request.id}</p>
          <p class="text-muted">Buyer: ${request.buyer}</p>
          <p><strong>Description:</strong> ${request.description}</p>
          <p><strong>Deadline:</strong> ${request.deadline}</p>
        </div>
        <div class="text-right ml-4">
          <div class="status-badge status-pending mb-2">${request.status}</div>
          <div class="mb-2"><strong>${request.price}</strong></div>
          <div class="flex flex-col gap-2">
            <button class="btn btn-success" onclick="acceptRequest('${request.id}')">Accept</button>
            <button class="btn btn-warning" onclick="requestChanges('${request.id}')">Request Changes</button>
            <button class="btn btn-danger" onclick="rejectRequest('${request.id}')">Reject</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// Accept request
function acceptRequest(requestId) {
  if (confirm('Are you sure you want to accept this request?')) {
    alert('Request accepted! The buyer will be notified.');
    loadIncomingRequests(); // Refresh the list
    loadActiveOrders(); // Update active orders
  }
}

// Request changes
function requestChanges(requestId) {
  const changes = prompt('What changes would you like to request?');
  if (changes) {
    alert('Changes requested! The buyer will review your suggestions.');
    loadIncomingRequests();
  }
}

// Reject request
function rejectRequest(requestId) {
  const reason = prompt('Please provide a reason for rejection:');
  if (reason) {
    alert('Request rejected. The buyer will be notified.');
    loadIncomingRequests();
  }
}

// Load active orders
function loadActiveOrders() {
  const activeOrdersList = document.getElementById('activeOrdersList');
  
  const activeOrders = [
    {
      id: 'AO001',
      buyer: 'Alice Johnson',
      productType: 'Logo Design',
      amount: '$200',
      status: 'In Progress',
      deadline: '2024-02-15',
      progress: 60
    }
  ];
  
  activeOrdersList.innerHTML = activeOrders.map(order => `
    <div class="dashboard-card" style="margin-bottom: 1rem;">
      <div class="flex justify-between items-center">
        <div class="flex-1">
          <h3>${order.productType}</h3>
          <p class="text-muted">Order ID: ${order.id}</p>
          <p class="text-muted">Buyer: ${order.buyer}</p>
          <p><strong>Deadline:</strong> ${order.deadline}</p>
          <div class="mt-2">
            <div class="flex justify-between text-sm">
              <span>Progress</span>
              <span>${order.progress}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div class="bg-blue-600 h-2 rounded-full" style="width: ${order.progress}%"></div>
            </div>
          </div>
        </div>
        <div class="text-right ml-4">
          <div class="status-badge status-pending mb-2">${order.status}</div>
          <div class="mb-2"><strong>${order.amount}</strong></div>
          <button class="btn btn-success" onclick="markAsDelivered('${order.id}')">Mark as Delivered</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Mark as delivered
function markAsDelivered(orderId) {
  if (confirm('Are you sure you want to mark this order as delivered?')) {
    alert('Order marked as delivered! Waiting for buyer confirmation.');
    loadActiveOrders();
    loadOrderHistory();
  }
}

// Load order history
function loadOrderHistory() {
  const orderHistoryList = document.getElementById('orderHistoryList');
  
  const orderHistory = [
    {
      id: 'OH001',
      buyer: 'Charlie Brown',
      productType: 'Website Design',
      amount: '$300',
      status: 'Completed',
      date: '2024-01-10'
    },
    {
      id: 'OH002',
      buyer: 'Diana Prince',
      productType: 'Mobile App',
      amount: '$1200',
      status: 'Completed',
      date: '2024-01-05'
    }
  ];
  
  orderHistoryList.innerHTML = orderHistory.map(order => `
    <div class="dashboard-card" style="margin-bottom: 1rem;">
      <div class="flex justify-between items-center">
        <div>
          <h3>${order.productType}</h3>
          <p class="text-muted">Order ID: ${order.id}</p>
          <p class="text-muted">Buyer: ${order.buyer}</p>
          <p class="text-muted">Date: ${order.date}</p>
        </div>
        <div class="text-right">
          <div class="status-badge status-accepted mb-2">${order.status}</div>
          <div><strong>${order.amount}</strong></div>
        </div>
      </div>
    </div>
  `).join('');
}

// Load sample data on page load
function loadSampleData() {
  loadActiveOrders();
  loadOrderHistory();
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