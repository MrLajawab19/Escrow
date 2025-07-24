const sellerInput = document.getElementById('sellerName');
const loadBtn = document.getElementById('loadEscrows');
const escrowList = document.getElementById('escrowList');

loadBtn.addEventListener('click', async () => {
  const sellerName = sellerInput.value.trim();
  if (!sellerName) return;
  const res = await fetch(`/escrow/list?role=seller&name=${encodeURIComponent(sellerName)}`);
  const escrows = await res.json();
  renderEscrows(escrows);
});

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
      <div><b>Buyer:</b> ${e.buyer}</div>
      <div><b>Amount:</b> $${e.amount}</div>
      <div><b>Status:</b> <span class="escrow-status">${e.status}</span></div>
      <div><b>Created:</b> ${new Date(e.createdAt).toLocaleString()}</div>
      <div><b>Updated:</b> ${new Date(e.updatedAt).toLocaleString()}</div>
    `;
    escrowList.appendChild(card);
  });
} 