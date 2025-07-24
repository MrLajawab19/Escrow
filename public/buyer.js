const form = document.getElementById('escrowForm');
const escrowList = document.getElementById('escrowList');
let buyerName = '';

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  buyerName = document.getElementById('buyerName').value.trim();
  const seller = document.getElementById('sellerName').value.trim();
  const amount = document.getElementById('amount').value;
  if (!buyerName || !seller || !amount) return;
  const res = await fetch('/escrow/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ buyer: buyerName, seller, amount })
  });
  if (res.ok) {
    form.reset();
    loadEscrows();
  }
});

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
    const card = document.createElement('div');
    card.className = 'escrow-card';
    card.innerHTML = `
      <div><b>Seller:</b> ${e.seller}</div>
      <div><b>Amount:</b> $${e.amount}</div>
      <div><b>Status:</b> <span class="escrow-status">${e.status}</span></div>
      <div><b>Created:</b> ${new Date(e.createdAt).toLocaleString()}</div>
      <div><b>Updated:</b> ${new Date(e.updatedAt).toLocaleString()}</div>
    `;
    if (e.status === 'confirmed') {
      const releaseBtn = document.createElement('button');
      releaseBtn.textContent = 'Release Funds';
      releaseBtn.onclick = async () => {
        await fetch(`/escrow/release/${e.id}`, { method: 'POST' });
        loadEscrows();
      };
      const refundBtn = document.createElement('button');
      refundBtn.textContent = 'Refund';
      refundBtn.onclick = async () => {
        await fetch(`/escrow/refund/${e.id}`, { method: 'POST' });
        loadEscrows();
      };
      card.appendChild(releaseBtn);
      card.appendChild(refundBtn);
    } else if (e.status === 'pending') {
      const confirmBtn = document.createElement('button');
      confirmBtn.textContent = 'Simulate Payment';
      confirmBtn.onclick = async () => {
        await fetch(`/escrow/confirm/${e.id}`, { method: 'POST' });
        loadEscrows();
      };
      card.appendChild(confirmBtn);
    }
    escrowList.appendChild(card);
  });
}

// Auto-load escrows when buyer name is entered
form.buyerName.addEventListener('change', (e) => {
  buyerName = e.target.value.trim();
  if (buyerName) loadEscrows();
}); 