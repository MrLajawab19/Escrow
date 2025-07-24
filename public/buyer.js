const scopeForm = document.getElementById('scopeForm');
const scopeStatus = document.getElementById('scopeStatus');
const escrowList = document.getElementById('escrowList');
const disputeList = document.getElementById('disputeList');
let buyerName = '';

// Scope Box submission
scopeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(scopeForm);
  buyerName = formData.get('buyerName').trim();
  if (!buyerName) return;
  if (!formData.get('acceptTerms')) {
    scopeStatus.textContent = 'You must accept the terms.';
    return;
  }
  const res = await fetch('/escrow/scope/submit', {
    method: 'POST',
    body: formData
  });
  if (res.ok) {
    scopeForm.reset();
    scopeStatus.textContent = 'Scope submitted! Waiting for seller approval.';
    loadScopes();
  } else {
    scopeStatus.textContent = 'Error submitting scope.';
  }
});

// Load buyer's scopes and show status
async function loadScopes() {
  if (!buyerName) return;
  const res = await fetch(`/escrow/scope/buyer?buyerName=${encodeURIComponent(buyerName)}`);
  const scopes = await res.json();
  renderScopes(scopes);
}

function renderScopes(scopes) {
  scopeStatus.innerHTML = '';
  if (!scopes.length) return;
  scopes.forEach(scope => {
    let colorClass = 'scope-status-yellow';
    if (scope.status === 'accepted') colorClass = 'scope-status-green';
    if (scope.status === 'rejected' || scope.status === 'change_requested') colorClass = 'scope-status-red';
    scopeStatus.innerHTML += `<div class="${colorClass}"><b>Scope:</b> ${scope.productName} | <b>Status:</b> ${scope.status.replace('_', ' ')}${scope.attachment ? ` | <a class='attachment-link' href='${scope.attachment}' target='_blank'>Attachment</a>` : ''}${scope.lastMessage ? ` | <i>${scope.lastMessage}</i>` : ''}</div>`;
    if (scope.status === 'change_requested') {
      scopeStatus.innerHTML += `<button onclick="editScope('${scope.id}')">Edit Scope</button>`;
    }
  });
}

// Edit scope (if change requested)
window.editScope = async function(scopeId) {
  // For MVP, just reload the form with previous data (could be improved with a modal)
  const res = await fetch(`/escrow/scope/buyer?buyerName=${encodeURIComponent(buyerName)}`);
  const scopes = await res.json();
  const scope = scopes.find(s => s.id === scopeId);
  if (!scope) return;
  document.getElementById('productName').value = scope.productName;
  document.getElementById('sellerName').value = scope.sellerName;
  document.getElementById('howFound').value = scope.howFound;
  document.getElementById('sellerHandle').value = scope.sellerHandle;
  document.getElementById('productDetails').value = scope.productDetails;
  document.getElementById('deliveryDays').value = scope.deliveryDays;
  // On submit, call /escrow/scope/edit
  scopeForm.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(scopeForm);
    formData.append('scopeId', scopeId);
    const res = await fetch('/escrow/scope/edit', {
      method: 'POST',
      body: formData
    });
    if (res.ok) {
      scopeForm.reset();
      scopeStatus.textContent = 'Scope updated! Waiting for seller approval.';
      scopeForm.onsubmit = null;
      loadScopes();
    } else {
      scopeStatus.textContent = 'Error updating scope.';
    }
  };
};

// Escrow list (after scope accepted and amount set)
async function loadEscrows() {
  if (!buyerName) return;
  const res = await fetch(`/escrow/list?role=buyer&name=${encodeURIComponent(buyerName)}`);
  const escrows = await res.json();
  renderEscrows(escrows);
}

function renderEscrows(escrows) {
  escrowList.innerHTML = '';
  if (!escrows.length) {
    escrowList.innerHTML = '<p>No escrows yet.</p>';
    return;
  }
  escrows.forEach(e => {
    let colorClass = 'scope-status-yellow';
    if (e.status === 'released') colorClass = 'scope-status-green';
    if (e.status === 'disputed') colorClass = 'scope-status-red';
    escrowList.innerHTML += `
      <div class="escrow-card ${colorClass}">
        <div><b>Seller:</b> ${e.seller}</div>
        <div><b>Product:</b> ${e.productName}</div>
        <div><b>Amount:</b> $${e.amount || 'Not set'}</div>
        <div><b>Status:</b> <span>${e.status}</span></div>
        <div><b>Accepted:</b> ${e.acceptedAt ? new Date(e.acceptedAt).toLocaleString() : ''}</div>
        <div><b>Auto Release At:</b> ${e.autoReleaseAt ? new Date(e.autoReleaseAt).toLocaleString() : ''}</div>
        <div><b>Created:</b> ${new Date(e.createdAt).toLocaleString()}</div>
        <div><b>Updated:</b> ${new Date(e.updatedAt).toLocaleString()}</div>
        ${e.status === 'pending' && !e.amount ? `<form onsubmit="setAmount(event, '${e.scopeId}')"><input type='number' min='1' placeholder='Set Amount' required><button type='submit'>Set</button></form>` : ''}
        ${e.status === 'pending' && e.amount ? `<button onclick="confirmPayment('${e.id}')">Simulate Payment</button>` : ''}
        ${e.status === 'confirmed' ? `<button onclick="releaseFunds('${e.id}')">Release Funds</button><button onclick="refundEscrow('${e.id}')">Refund</button><button onclick="raiseDispute('${e.id}')">Raise Dispute</button>` : ''}
        ${e.status === 'disputed' ? `<span class='scope-status-red'>Disputed</span>` : ''}
      </div>
    `;
  });
}

window.setAmount = async function(e, scopeId) {
  e.preventDefault();
  const amount = e.target.querySelector('input').value;
  const res = await fetch('/escrow/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scopeId, amount })
  });
  if (res.ok) loadEscrows();
};

window.confirmPayment = async function(id) {
  await fetch(`/escrow/confirm/${id}`, { method: 'POST' });
  loadEscrows();
};
window.releaseFunds = async function(id) {
  await fetch(`/escrow/release/${id}`, { method: 'POST' });
  loadEscrows();
};
window.refundEscrow = async function(id) {
  await fetch(`/escrow/refund/${id}`, { method: 'POST' });
  loadEscrows();
};

// Dispute Tracker
async function loadDisputes() {
  if (!buyerName) return;
  const res = await fetch(`/escrow/dispute/list?user=${encodeURIComponent(buyerName)}&role=buyer`);
  const disputes = await res.json();
  renderDisputes(disputes);
}
function renderDisputes(disputes) {
  disputeList.innerHTML = '';
  if (!disputes.length) {
    disputeList.innerHTML = '<p>No disputes yet.</p>';
    return;
  }
  disputes.forEach(d => {
    let colorClass = 'dispute-status-open';
    if (d.status === 'closed') colorClass = 'dispute-status-closed';
    if (d.status === 'under review') colorClass = 'dispute-status-review';
    disputeList.innerHTML += `
      <div class="${colorClass}"><b>ID:</b> ${d.id} | <b>Status:</b> ${d.status} | <b>Party:</b> ${d.raisedBy}<br><b>Subject:</b> ${d.subject}<br><b>Description:</b> ${d.description}<br>${d.evidence ? `<a class='attachment-link' href='${d.evidence}' target='_blank'>Evidence</a>` : ''}</div>
    `;
  });
}

window.raiseDispute = function(escrowId) {
  const subject = prompt('Dispute Subject:');
  const description = prompt('Describe the issue:');
  const atFault = prompt('Who is at fault? (Buyer/Seller/Unknown)');
  // For MVP, skip file upload in prompt
  if (!subject || !description || !atFault) return;
  fetch('/escrow/dispute/raise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ escrowId, subject, description, atFault, raisedBy: buyerName })
  }).then(() => loadDisputes());
};

// Collapsible Scope Box
const scopeBox = document.getElementById('scopeBox');
document.getElementById('scopeBoxToggle').onclick = () => {
  scopeBox.classList.toggle('collapsed');
};

// Auto-load on buyer name change
scopeForm.buyerName.addEventListener('change', (e) => {
  buyerName = e.target.value.trim();
  if (buyerName) {
    loadScopes();
    loadEscrows();
    loadDisputes();
  }
}); 