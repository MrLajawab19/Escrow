// Modern Buyer Dashboard JavaScript
let currentBuyer = '';
let currentOrder = null;
let countdownInterval = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
  // Set default buyer name
  currentBuyer = 'John Doe';
  document.getElementById('buyerName').textContent = currentBuyer;
  
  // Load transaction history
  loadTransactionHistory();
});

// Scope Box Modal Functions
function openScopeBox() {
  const modal = document.getElementById('scopeModal');
  modal.classList.add('active');
}

function closeScopeBox() {
  const modal = document.getElementById('scopeModal');
  modal.classList.remove('active');
  document.getElementById('scopeForm').reset();
}

// Handle scope form submission
document.getElementById('scopeForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const platformName = document.getElementById('platformName').value;
  const platformLink = document.getElementById('platformLink').value;
  const productPrice = document.getElementById('productPrice').value;
  
  if (!platformName || !platformLink || !productPrice) {
    alert('Please fill in all required fields');
    return;
  }
  
  // Simulate payment processing
  const payButton = this.querySelector('button[type="submit"]');
  payButton.textContent = 'Processing Payment...';
  payButton.disabled = true;
  
  // Simulate payment delay
  setTimeout(() => {
    payButton.textContent = 'Payment Successful!';
    
    // Show postman animation
    showPostmanAnimation();
    
    // Close modal after animation
    setTimeout(() => {
      closeScopeBox();
      showOrderSummary(formData);
    }, 3000);
  }, 2000);
});

// Show postman animation
function showPostmanAnimation() {
  const animationContainer = document.getElementById('animationContainer');
  animationContainer.classList.remove('hidden');
  
  // Hide after animation completes
  setTimeout(() => {
    animationContainer.classList.add('hidden');
  }, 3000);
}

// Show order summary
function showOrderSummary(formData) {
  const orderSummary = document.getElementById('orderSummary');
  const orderDetails = document.getElementById('orderDetails');
  
  // Create order details HTML
  orderDetails.innerHTML = `
    <div class="flex flex-col gap-2">
      <div><strong>Product Type:</strong> ${formData.get('productType')}</div>
      <div><strong>Description:</strong> ${formData.get('description')}</div>
      <div><strong>Quality Conditions:</strong> ${formData.get('qualityConditions')}</div>
      <div><strong>Deadline:</strong> ${new Date(formData.get('deadline')).toLocaleString()}</div>
      <div><strong>Price:</strong> $${document.getElementById('productPrice').value}</div>
    </div>
  `;
  
  orderSummary.classList.remove('hidden');
  
  // Start countdown timer
  startCountdown();
}

// Countdown timer
function startCountdown() {
  let timeLeft = 72 * 60 * 60; // 72 hours in seconds
  
  countdownInterval = setInterval(() => {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    
    document.getElementById('countdown').textContent = 
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      document.getElementById('countdown').textContent = 'Time Expired';
    }
    
    timeLeft--;
  }, 1000);
}

// Action functions
function releaseFunds() {
  if (confirm('Are you sure you want to release funds to the seller?')) {
    alert('Funds released successfully!');
    document.getElementById('orderSummary').classList.add('hidden');
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    loadTransactionHistory();
  }
}

function raiseDispute() {
  const subject = prompt('Dispute Subject:');
  const description = prompt('Describe the issue:');
  
  if (subject && description) {
    alert('Dispute raised successfully! Our team will review it within 24 hours.');
    loadTransactionHistory();
  }
}

// Load transaction history
function loadTransactionHistory() {
  const transactionList = document.getElementById('transactionList');
  
  // Simulate transaction data
  const transactions = [
    {
      id: 'TX001',
      type: 'Logo Design',
      amount: '$150',
      status: 'Completed',
      date: '2024-01-15'
    },
    {
      id: 'TX002',
      type: 'Website Development',
      amount: '$500',
      status: 'In Progress',
      date: '2024-01-20'
    }
  ];
  
  transactionList.innerHTML = transactions.map(tx => `
    <div class="dashboard-card" style="margin-bottom: 1rem;">
      <div class="flex justify-between items-center">
        <div>
          <h3>${tx.type}</h3>
          <p class="text-muted">Transaction ID: ${tx.id}</p>
          <p class="text-muted">Date: ${tx.date}</p>
        </div>
        <div class="text-right">
          <div class="status-badge ${tx.status === 'Completed' ? 'status-accepted' : 'status-pending'}">
            ${tx.status}
          </div>
          <div class="mt-1"><strong>${tx.amount}</strong></div>
        </div>
      </div>
    </div>
  `).join('');
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

// Close modal when clicking outside
document.getElementById('scopeModal').addEventListener('click', function(e) {
  if (e.target === this) {
    closeScopeBox();
  }
});

// File upload preview
document.getElementById('attachments').addEventListener('change', function(e) {
  const files = e.target.files;
  const fileUpload = document.querySelector('.file-upload');
  
  if (files.length > 0) {
    fileUpload.innerHTML = `
      <div class="upload-icon">✅</div>
      <p>${files.length} file(s) selected</p>
      <p class="text-muted">${Array.from(files).map(f => f.name).join(', ')}</p>
    `;
  }
}); 