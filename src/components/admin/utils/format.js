export const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const fmtTime = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export const fmtCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  return '₹' + amount.toLocaleString('en-IN');
};
