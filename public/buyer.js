// Modern Buyer Dashboard JavaScript - Vector Style UI
let currentBuyer = '';
let currentOrder = null;
let countdownInterval = null;
let generatedLink = '';
let paymentConfirmed = false;
let uploadedFiles = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
  // Set default buyer name
  currentBuyer = document.getElementById('buyerName').value;
  
  // Load transaction history
  loadTransactionHistory();
  
  // Initialize file upload
  initializeFileUpload();
  
  // Initialize deadline validation
  initializeDeadlineValidation();
});

// Initialize file upload functionality
function initializeFileUpload() {
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  
  fileInput.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      // Check if file already exists
      const existingFile = uploadedFiles.find(f => f.name === file.name && f.size === file.size);
      if (!existingFile) {
        uploadedFiles.push(file);
      }
    });
    
    renderFileList();
  });
}

// Initialize deadline validation
function initializeDeadlineValidation() {
  const deadlineInput = document.getElementById('deadlineInput');
  const deadlineError = document.getElementById('deadlineError');
  
  deadlineInput.addEventListener('change', function() {
    validateDeadline();
  });
  
  // Set minimum date to today
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  deadlineInput.min = tomorrow.toISOString().slice(0, 16);
}

// Validate deadline
function validateDeadline() {
  const deadlineInput = document.getElementById('deadlineInput');
  const deadlineError = document.getElementById('deadlineError');
  const selectedDate = new Date(deadlineInput.value);
  const now = new Date();
  
  if (selectedDate <= now) {
    deadlineInput.classList.add('error');
    deadlineError.classList.remove('hidden');
    return false;
  } else {
    deadlineInput.classList.remove('error');
    deadlineError.classList.add('hidden');
    return true;
  }
}

// Render file list with thumbnails
function renderFileList() {
  const fileList = document.getElementById('fileList');
  
  if (uploadedFiles.length === 0) {
    fileList.innerHTML = '';
    return;
  }
  
  fileList.innerHTML = uploadedFiles.map((file, index) => {
    const fileIcon = getFileIcon(file.type);
    const fileSize = formatFileSize(file.size);
    
    return `
      <div class="file-item">
        <div class="file-info">
          <span class="file-icon">${fileIcon}</span>
          <div>
            <div class="file-name">${file.name}</div>
            <div class="file-size">${fileSize}</div>
          </div>
        </div>
        <button class="remove-file" onclick="removeFile(${index})">✖</button>
      </div>
    `;
  }).join('');
}

// Get appropriate icon for file type
function getFileIcon(fileType) {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('video')) return '🎥';
  if (fileType.includes('document') || fileType.includes('word')) return '📝';
  return '📎';
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Remove file from list
function removeFile(index) {
  uploadedFiles.splice(index, 1);
  renderFileList();
}

// Scope Box Modal Functions
function openScopeBox() {
  const modal = document.getElementById('scopeModal');
  modal.classList.add('active');
  
  // Set default deadline to 7 days from now
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);
  document.querySelector('input[name="deadline"]').value = deadline.toISOString().slice(0, 16);
}

function closeScopeBox() {
  const modal = document.getElementById('scopeModal');
  modal.classList.remove('active');
  document.getElementById('scopeForm').reset();
  uploadedFiles = [];
  renderFileList();
  
  // Clear any error states
  const deadlineInput = document.getElementById('deadlineInput');
  const deadlineError = document.getElementById('deadlineError');
  deadlineInput.classList.remove('error');
  deadlineError.classList.add('hidden');
}

// Handle scope form submission
document.getElementById('scopeForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  // Validate deadline first
  if (!validateDeadline()) {
    alert('Please select a valid deadline (future date and time)');
    return;
  }
  
  const formData = new FormData(this);
  const platformName = document.getElementById('platformName').value;
  const platformLink = document.getElementById('platformLink').value;
  const productPrice = document.getElementById('productPrice').value;
  const buyerName = document.getElementById('buyerName').value;
  
  if (!buyerName || !platformName || !platformLink || !productPrice) {
    alert('Please fill in all required fields');
    return;
  }
  
  // Simulate payment processing
  const payButton = this.querySelector('button[type="submit"]');
  const originalText = payButton.textContent;
  payButton.textContent = 'Processing Payment...';
  payButton.disabled = true;
  
  // Simulate payment delay
  setTimeout(() => {
    payButton.textContent = '✅ Payment Successful!';
    paymentConfirmed = true;
    
    // Close modal and show forward section
    setTimeout(() => {
      closeScopeBox();
      showForwardSection(formData);
    }, 1000);
  }, 2000);
});

// Show forward section after payment
function showForwardSection(formData) {
  const forwardSection = document.getElementById('forwardSection');
  forwardSection.classList.remove('hidden');
  
  // Scroll to forward section
  forwardSection.scrollIntoView({ behavior: 'smooth' });
  
  // Store form data for later use
  currentOrder = {
    formData: formData,
    buyerName: document.getElementById('buyerName').value,
    platformName: document.getElementById('platformName').value,
    platformLink: document.getElementById('platformLink').value,
    productPrice: document.getElementById('productPrice').value,
    currency: document.getElementById('currencySelect').value,
    country: document.getElementById('countrySelect').value,
    files: uploadedFiles
  };
}

// Generate unique link
function generateLink() {
  const sellerContact = document.getElementById('sellerContact').value.trim();
  
  if (!sellerContact) {
    alert('Please enter seller contact information');
    return;
  }
  
  if (!isValidEmail(sellerContact) && !isValidPhone(sellerContact)) {
    alert('Please enter a valid email address or phone number');
    return;
  }
  
  // Generate unique transaction ID
  const transactionId = 'txn' + Math.random().toString(36).substr(2, 9);
  generatedLink = `escrowx.com/scope/${transactionId}`;
  
  // Show success message
  const generateBtn = document.getElementById('generateLinkBtn');
  const originalText = generateBtn.textContent;
  generateBtn.textContent = '✅ Link Generated!';
  generateBtn.disabled = true;
  
  // Show link section
  document.getElementById('generatedLink').value = generatedLink;
  document.getElementById('linkSection').classList.remove('hidden');
  
  // Enable send button
  document.getElementById('sendScopeBoxBtn').disabled = false;
  
  // Reset button after 2 seconds
  setTimeout(() => {
    generateBtn.textContent = originalText;
    generateBtn.disabled = false;
  }, 2000);
}

// Copy link to clipboard
function copyLink() {
  const linkInput = document.getElementById('generatedLink');
  linkInput.select();
  linkInput.setSelectionRange(0, 99999); // For mobile devices
  
  try {
    document.execCommand('copy');
    showToast('Link copied to clipboard!');
  } catch (err) {
    // Fallback for modern browsers
    navigator.clipboard.writeText(generatedLink).then(() => {
      showToast('Link copied to clipboard!');
    });
  }
}

// Share link
function shareLink() {
  if (navigator.share) {
    navigator.share({
      title: 'EscrowX Scope Box',
      text: 'Please review this scope box request',
      url: generatedLink
    });
  } else {
    copyLink();
  }
}

// Send scope box to seller
function sendScopeBox() {
  if (!generatedLink) {
    alert('Please generate a link first');
    return;
  }
  
  // Show postman animation
  showPostmanAnimation();
  
  // Hide forward section and show order history after animation
  setTimeout(() => {
    document.getElementById('forwardSection').classList.add('hidden');
    showOrderHistory(currentOrder.formData);
  }, 3000);
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

// Show postman animation
function showPostmanAnimation() {
  const animationContainer = document.getElementById('animationContainer');
  animationContainer.classList.remove('hidden');
  
  // Hide after animation completes
  setTimeout(() => {
    animationContainer.classList.add('hidden');
  }, 3000);
}

// Show order history
function showOrderHistory(formData) {
  const orderHistory = document.getElementById('orderHistory');
  const orderDetails = document.getElementById('orderDetails');
  
  // Create order details HTML
  orderDetails.innerHTML = `
    <div class="flex flex-col gap-2">
      <div><strong>Buyer Name:</strong> ${currentOrder.buyerName}</div>
      <div><strong>Platform:</strong> ${currentOrder.platformName}</div>
      <div><strong>Platform Link:</strong> <a href="${currentOrder.platformLink}" target="_blank">${currentOrder.platformLink}</a></div>
      <div><strong>Country:</strong> ${currentOrder.country}</div>
      <div><strong>Product Type:</strong> ${currentOrder.formData.get('productType')}</div>
      <div><strong>Description:</strong> ${currentOrder.formData.get('description')}</div>
      <div><strong>Quality Conditions:</strong> ${currentOrder.formData.get('qualityConditions')}</div>
      <div><strong>Deadline:</strong> ${new Date(formData.get('deadline')).toLocaleString()}</div>
      <div><strong>Price:</strong> ${getCurrencySymbol(currentOrder.currency)}${currentOrder.productPrice}</div>
      <div><strong>Seller Contact:</strong> ${document.getElementById('sellerContact').value}</div>
      <div><strong>Scope Link:</strong> <a href="${generatedLink}" target="_blank">${generatedLink}</a></div>
      ${uploadedFiles.length > 0 ? `<div><strong>Attachments:</strong> ${uploadedFiles.length} file(s)</div>` : ''}
    </div>
  `;
  
  orderHistory.classList.remove('hidden');
  
  // Start countdown timer
  startCountdown();
}

// Get currency symbol
function getCurrencySymbol(currency) {
  const symbols = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': '$',
    'AUD': '$'
  };
  return symbols[currency] || currency;
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
          <p>Transaction ID: ${generatedLink.split('/').pop()}</p>
          <p>Date: ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="details">
          <div class="detail-row"><span class="label">Buyer Name:</span> ${currentOrder.buyerName}</div>
          <div class="detail-row"><span class="label">Platform:</span> ${currentOrder.platformName}</div>
          <div class="detail-row"><span class="label">Product Type:</span> ${currentOrder.formData.get('productType')}</div>
          <div class="detail-row"><span class="label">Price:</span> ${getCurrencySymbol(currentOrder.currency)}${currentOrder.productPrice}</div>
          <div class="detail-row"><span class="label">Deadline:</span> ${new Date(currentOrder.formData.get('deadline')).toLocaleString()}</div>
          <div class="detail-row"><span class="label">Description:</span> ${currentOrder.formData.get('description')}</div>
          <div class="detail-row"><span class="label">Quality Conditions:</span> ${currentOrder.formData.get('qualityConditions')}</div>
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

// Action functions
function releaseFunds() {
  if (confirm('Are you sure you want to release funds to the seller?')) {
    alert('Funds released successfully!');
    document.getElementById('orderHistory').classList.add('hidden');
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
      amount: '₹1500',
      status: 'Completed',
      date: '2024-01-15'
    },
    {
      id: 'TX002',
      type: 'Account Selling',
      amount: '₹5000',
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