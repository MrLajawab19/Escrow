import React, { useState } from 'react';
import ScopeBoxModal from './ScopeBoxModal';

const initialOrder = {
  buyerName: '',
  platform: '',
  productLink: '',
  country: '',
  currency: '',
  sellerContact: '',
  scopeBox: null,
};

const platforms = ['Upwork', 'Fiverr', 'Freelancer', 'Other'];
const countries = ['India', 'USA', 'UK', 'Canada', 'Other'];
const currencies = ['USD', 'INR', 'EUR', 'GBP', 'Other'];

export default function NewOrderModal({ open, onClose, onOrderCreated }) {
  const [step, setStep] = useState(1);
  const [order, setOrder] = useState(initialOrder);
  const [showScopeBox, setShowScopeBox] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderLink, setOrderLink] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleInput = (e) => {
    setOrder({ ...order, [e.target.name]: e.target.value });
  };

  const handleScopeBoxSubmit = (scopeBoxData) => {
    setOrder({ ...order, scopeBox: scopeBoxData });
    setShowScopeBox(false);
  };

  const handleNext = () => {
    if (step === 1 && order.scopeBox) setStep(2);
    else if (step === 2 && order.sellerContact) setStep(3);
  };

  const handleCreateOrder = () => {
    setLoading(true);
    setTimeout(() => {
      const fakeId = Math.random().toString(36).substring(2, 8);
      setOrderLink(`https://scrowx.app/order/${fakeId}`);
      setLoading(false);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onOrderCreated && onOrderCreated(order);
        onClose();
      }, 1500);
    }, 1200);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative animate-fadeIn">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">{step === 1 ? '+ New Order' : step === 2 ? 'Seller Details' : 'Order Link'}</h2>
        {step === 1 && (
          <>
            <div className="space-y-3">
              <input name="buyerName" value={order.buyerName} onChange={handleInput} placeholder="Buyer Name" className="input w-full" required />
              <select name="platform" value={order.platform} onChange={handleInput} className="input w-full" required>
                <option value="">Select Platform</option>
                {platforms.map(p => <option key={p}>{p}</option>)}
              </select>
              <input name="productLink" value={order.productLink} onChange={handleInput} placeholder="Product Link" className="input w-full" required />
              <select name="country" value={order.country} onChange={handleInput} className="input w-full" required>
                <option value="">Select Country</option>
                {countries.map(c => <option key={c}>{c}</option>)}
              </select>
              <select name="currency" value={order.currency} onChange={handleInput} className="input w-full" required>
                <option value="">Select Currency</option>
                {currencies.map(c => <option key={c}>{c}</option>)}
              </select>
              <button type="button" className="btn btn-outline w-full" onClick={() => setShowScopeBox(true)}>
                {order.scopeBox ? 'Edit Scope Box' : '+ Scope Box'}
              </button>
              {order.scopeBox && <div className="text-green-600 text-sm">Scope Box added ✓</div>}
            </div>
            <div className="flex justify-end mt-6">
              <button className="btn btn-primary" disabled={!order.buyerName || !order.platform || !order.productLink || !order.country || !order.currency || !order.scopeBox} onClick={handleNext}>Next</button>
            </div>
            {showScopeBox && <ScopeBoxModal open={showScopeBox} onClose={() => setShowScopeBox(false)} onSubmit={handleScopeBoxSubmit} initialData={order.scopeBox} />}
          </>
        )}
        {step === 2 && (
          <>
            <input name="sellerContact" value={order.sellerContact} onChange={handleInput} placeholder="Seller Email or Phone" className="input w-full mb-4" required />
            <div className="flex justify-between mt-6">
              <button className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary" disabled={!order.sellerContact} onClick={handleNext}>Next</button>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <div className="mb-4">
              <div className="font-semibold">Escrow Order Link:</div>
              <div className="bg-gray-100 rounded p-2 flex items-center justify-between">
                <span className="truncate text-blue-600">{orderLink || 'Generating...'}</span>
                <button className="btn btn-xs ml-2" onClick={() => navigator.clipboard.writeText(orderLink)}>Copy</button>
              </div>
            </div>
            <button className="btn btn-primary w-full" disabled={loading || !!orderLink} onClick={handleCreateOrder}>
              {loading ? 'Creating...' : 'Send Link'}
            </button>
          </>
        )}
        {showToast && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded shadow-lg animate-fadeIn">Order Created! Link sent to seller.</div>
        )}
      </div>
    </div>
  );
}

// Tailwind utility classes for input/button
// .input: border, rounded, px-3, py-2, focus:ring, etc.
// .btn: px-4, py-2, rounded, font-bold, bg-primary, hover:bg-primary-600, etc.
// .btn-outline: border, bg-white, text-primary, hover:bg-primary-50
// .btn-xs: text-xs, px-2, py-1 