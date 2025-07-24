const sellerInput = document.getElementById('sellerName');
const loadScopesBtn = document.getElementById('loadScopes');
const scopeList = document.getElementById('scopeList');
const escrowList = document.getElementById('escrowList');
const disputeList = document.getElementById('disputeList');
let sellerName = '';

loadScopesBtn.addEventListener('click', async () => {
  sellerName = sellerInput.value.trim();
  if (!sellerName) return;
  loadScopes();
  loadEscrows();
  loadDisputes();
});

// Load incoming scopes
async function loadScopes() {
  const res = await fetch(`/escrow/scope/list?sellerName=${encodeURIComponent(sellerName)}`);
  const scopes = await res.json();
  renderScopes(scopes);
}
function renderScopes(scopes) {
  scopeList.innerHTML = '';
  if (!scopes.length) {
    scopeList.innerHTML = '<p>No incoming scopes.</p>';
    return;
  }
  scopes.forEach(scope => {
    let colorClass = 'scope-status-yellow';
    if (scope.status === 'accepted') colorClass = 'scope-status-green';
    if (scope.status === 'rejected' || scope.status === 'change_requested') colorClass = 'scope-status-red';
    scopeList.innerHTML += `
      <div class="scope-box ${colorClass}">
        <b>Product:</b> ${scope.productName}<br>
        <b>Buyer:</b> ${scope.buyerName}<br>
        <b>Details:</b> ${scope.productDetails}<br>
        <b>Delivery:</b> ${scope.deliveryDays} days<br>
        <b>How found:</b> ${scope.howFound}<br>
        <b>Handle:</b> <a class='attachment-link' href='${scope.sellerHandle}' target='_blank'>${scope.sellerHandle}</a><br>
        ${scope.attachment ? `<a class='attachment-link' href='${scope.attachment}' target='_blank'>Attachment</a><br>` : ''}
        <b>Status:</b> ${scope.status.replace('_', ' ')}<br>
        <b>Message:</b> ${scope.lastMessage || ''}<br>
        <button onclick="respondScope('${scope.id}', 'accept')">Accept</button>
        <button onclick="respondScope('${scope.id}', 'request_change')">Request Change</button>
        <button onclick="respondScope('${scope.id}', 'reject')">Reject</button>
      </div>
    `;
  });
}

window.respondScope = function(scopeId, action) {
  let message = '';
  let newDeliveryDays = '';
  if (action === 'request_change') {
    message = prompt('Request change message:');
    newDeliveryDays = prompt('Suggest new delivery days (optional):');
  } else if (action === 'reject') {
    message = prompt('Reason for rejection:');
  }
  fetch('/escrow/scope/respond', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scopeId, action, message, newDeliveryDays })
  }).then(() => loadScopes());
};

// Escrow list
async function loadEscrows() {
  if (!sellerName) return;
  const res = await fetch(`/escrow/list?role=seller&name=${encodeURIComponent(sellerName)}`);
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
        <div><b>Buyer:</b> ${e.buyer}</div>
        <div><b>Product:</b> ${e.productName}</div>
        <div><b>Amount:</b> $${e.amount || 'Not set'}</div>
        <div><b>Status:</b> <span>${e.status}</span></div>
        <div><b>Accepted:</b> ${e.acceptedAt ? new Date(e.acceptedAt).toLocaleString() : ''}</div>
        <div><b>Auto Release At:</b> ${e.autoReleaseAt ? new Date(e.autoReleaseAt).toLocaleString() : ''}</div>
        <div><b>Created:</b> ${new Date(e.createdAt).toLocaleString()}</div>
        <div><b>Updated:</b> ${new Date(e.updatedAt).toLocaleString()}</div>
        ${e.status === 'confirmed' ? `<button onclick="raiseDispute('${e.id}')">Raise Dispute</button>` : ''}
        ${e.status === 'disputed' ? `<span class='scope-status-red'>Disputed</span>` : ''}
      </div>
    `;
  });
}

// Dispute Tracker
async function loadDisputes() {
  if (!sellerName) return;
  const res = await fetch(`/escrow/dispute/list?user=${encodeURIComponent(sellerName)}&role=seller`);
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
    body: JSON.stringify({ escrowId, subject, description, atFault, raisedBy: sellerName })
  }).then(() => loadDisputes());
}; 