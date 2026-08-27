import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import KYCModal from '../components/KYCModal';
import { RefreshCcw, ArrowRight, Check, AlertTriangle, CheckCircle2, ChevronRight, Save, Lock } from 'lucide-react';

export default function NewDeedPage() {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [buyerData, setBuyerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [deedData, setDeedData] = useState(null);
  
  const [kycStatus, setKycStatus] = useState({ phoneVerified: false, kycComplete: false, reviewStatus: 'PENDING' });
  const [showKycModal, setShowKycModal] = useState(false);
  
  // 1. Autosave & Stage tracking logic
  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem('scrowx_new_deed_draft');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error('Error parsing draft:', e); }
    }
    return {
      currentStage: 1, // Explicit stage tracking for autosave recovery
      title: '',
      description: '',
      acceptanceCriteria: '',
      amount: '',
      currency: 'INR',
      deadline: '',
      revisionLimit: '',
      deliverableFormats: '',
      isMilestone: false,
      milestones: [],
      scopeBox: {
        platform: '',
        sellerContact: ''
      }
    };
  });

  const [step, setStep] = useState(form.currentStage || 1);
  const [saveTime, setSaveTime] = useState(new Date());

  // Keep form.currentStage in sync
  useEffect(() => {
    if (form.currentStage !== step) {
      setForm(prev => ({ ...prev, currentStage: step }));
    }
  }, [step, form.currentStage]);

  // Autosave execution
  useEffect(() => {
    if (!showSuccess) {
      const saveDraft = setTimeout(() => {
        localStorage.setItem('scrowx_new_deed_draft', JSON.stringify(form));
        setSaveTime(new Date());
      }, 1000);
      return () => clearTimeout(saveDraft);
    }
  }, [form, showSuccess]);

  // Funding state
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [fundingLoading, setFundingLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');
    const data = localStorage.getItem('buyerData') || localStorage.getItem('userData');
    if (!token || !data) {
      navigate('/buyer/auth');
      return;
    }
    try { setBuyerData(JSON.parse(data)); } catch (e) { navigate('/buyer/auth'); }
    
    // Check KYC
    axios.get(`${import.meta.env.VITE_API_URL}/api/kyc/status`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => { if (res.data.success) setKycStatus(res.data.data); })
      .catch(() => {});
  }, [navigate]);

  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleScopeInput = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, [name]: value } }));
  };

  const addMilestone = () => setForm(prev => ({ ...prev, milestones: [...prev.milestones, { title: '', description: '', acceptanceCriteria: '', amount: '', deadline: '' }] }));
  const updateMilestone = (index, field, value) => {
    const newMilestones = [...form.milestones];
    newMilestones[index][field] = value;
    setForm({ ...form, milestones: newMilestones });
  };
  const removeMilestone = (index) => {
    const newMilestones = [...form.milestones];
    newMilestones.splice(index, 1);
    setForm({ ...form, milestones: newMilestones });
  };
  const getTotalMilestoneAmount = () => form.milestones.reduce((total, m) => total + (parseFloat(m.amount) || 0), 0);

  // 2. New 4-Stage Validation Logic
  const validateStage1 = () => !!(form.title && form.description && form.scopeBox.platform && form.scopeBox.sellerContact);
  
  const validateStage2 = () => {
    const base = form.acceptanceCriteria.length >= 50 && form.deadline;
    if (!form.isMilestone) return base;
    return base && form.milestones.length > 0 && form.milestones.every(m => m.title && m.amount && m.deadline);
  };
  
  // Stage 3 (Review - now requires explicit user acknowledgment)
  const validateStage3 = () => validateStage1() && validateStage2() && form.isReviewed;
  
  // The critical milestone math check moves to Stage 4 (Payment validation)
  const isMilestoneMathValid = () => !form.isMilestone || Math.abs(getTotalMilestoneAmount() - parseFloat(form.amount || 0)) <= 0.01;
  const validateStage4 = () => form.amount && form.currency && isMilestoneMathValid();

  // 3. Exact ScopeBox Completion Formula
  const calculateScopeBoxCompletion = () => {
    let points = 0;
    let total = 4;
    if (form.acceptanceCriteria?.length >= 50) points++;
    if (form.deadline) points++;
    if (form.deliverableFormats) points++;
    if (form.revisionLimit) points++;
    if (form.isMilestone) {
      total = 5;
      if (form.milestones.length > 0 && form.milestones.every(m => m.title && m.amount && m.deadline)) points++;
    }
    return Math.round((points / total) * 100);
  };

  const getMissingFields = () => {
    const missing = [];
    if (!form.title) missing.push("Project Title");
    if (!form.scopeBox.platform) missing.push("Platform");
    if (!form.scopeBox.sellerContact) missing.push("Seller Contact");
    if (!form.description) missing.push("Description");
    if (form.acceptanceCriteria.length < 50) missing.push("Acceptance Criteria (min 50 chars)");
    if (!form.deadline) missing.push("Delivery Deadline");
    if (form.isMilestone) {
      if (form.milestones.length === 0) missing.push("At least 1 Milestone");
      else if (form.milestones.some(m => !m.title || !m.amount || !m.deadline)) missing.push("Incomplete Milestone details");
    }
    if (step >= 4) {
      if (!form.amount) missing.push("Total Amount");
      if (form.isMilestone && !isMilestoneMathValid()) missing.push("Milestone Sum Mismatch");
    }
    return missing;
  };

  // Submission executes on Stage 4
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStage3() || !validateStage4()) {
      toast.error("Please complete all required fields correctly.");
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');
      const payload = {
        title: form.title,
        description: form.description,
        acceptanceCriteria: form.acceptanceCriteria,
        amount: Math.round(parseFloat(form.amount) * 100),
        currency: form.currency,
        deadline: form.deadline,
        revisionLimit: parseInt(form.revisionLimit) || 0,
        deliverableFormats: form.deliverableFormats.split(',').map(s => s.trim()).filter(Boolean),
        isMilestone: form.isMilestone,
        milestones: form.isMilestone ? form.milestones.map(m => ({ ...m, amount: Math.round(parseFloat(m.amount) * 100) })) : [],
        scopeBox: form.scopeBox,
        transactionType: 'SERVICE'
      };

      const res = await axios.post('/api/deeds', payload, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        localStorage.removeItem('scrowx_new_deed_draft'); // Clear on success
        setDeedData(res.data.data);
        setShowFundingModal(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create deed');
    } finally {
      setLoading(false);
    }
  };

  const handleFundingSubmit = async (e) => {
    if (e) e.preventDefault();
    setFundingLoading(true);
    try {
      const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');
      const fundResponse = await axios.post(`/api/wallet/top-up`, { amount: deedData.amount, targetDeedId: deedData.id }, { headers: { Authorization: `Bearer ${token}` } });
      
      if (fundResponse.data.success && fundResponse.data.data.razorpayOrderId) {
        const { razorpayOrderId, amount, currency } = fundResponse.data.data;
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TAVbIcT7jdp31E',
          amount: amount, currency: currency, name: 'ScrowX',
          description: `Fund Escrow for Deed: ${deedData.title}`,
          order_id: razorpayOrderId,
          handler: async function (response) {
            try {
              toast.loading('Payment received! Verifying...', { id: 'verify-payment' });

              // ── Primary Path: Synchronous server-side verification ───────────
              // Sends the Razorpay-signed payload to the backend for HMAC verification,
              // wallet credit, and escrow lock in a single round-trip. This is the
              // fast-path that works in both dev (no webhook) and production.
              try {
                const verifyRes = await axios.post(
                  `/api/deeds/${deedData.id}/verify-payment`,
                  {
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature
                  },
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                if (verifyRes.data.success) {
                  toast.success('Payment successful! Escrow funded.', { id: 'verify-payment' });
                  setShowFundingModal(false);
                  setShowSuccess(true);
                  return; // Done — no polling needed.
                }
              } catch (verifyErr) {
                // verify-payment failed (network error, 500, etc.) — fall through to
                // webhook polling. The payment is still captured; the webhook may still
                // credit the wallet and fund the deed asynchronously.
                console.warn('Direct verify-payment failed, falling back to webhook polling:', verifyErr.message);
                toast.loading('Payment received! Finishing setup...', { id: 'verify-payment' });
              }

              // ── Fallback Path: Webhook polling ───────────────────────────────
              // Polls the deed status every 3s for up to 60s waiting for the Razorpay
              // webhook to arrive and advance the deed from DRAFT → PENDING_SELLER.
              // IMPORTANT: on timeout, shows an honest error — NEVER shows success.
              let attempts = 0;
              const MAX_ATTEMPTS = 20;
              const pollInterval = setInterval(async () => {
                attempts++;
                try {
                  const checkRes = await axios.get(`/api/deeds/${deedData.id}`, { headers: { Authorization: `Bearer ${token}` } });
                  const status = checkRes.data.data?.status;

                  if (status && status !== 'DRAFT') {
                    // ✅ Backend confirmed — deed was actually funded by the webhook.
                    clearInterval(pollInterval);
                    toast.success('Payment successful! Escrow funded.', { id: 'verify-payment' });
                    setShowFundingModal(false);
                    setShowSuccess(true);
                  } else if (attempts >= MAX_ATTEMPTS) {
                    // ⏱️ Timeout — do NOT show "Deed Secured!". The deed is still DRAFT.
                    // Show an honest pending state and let the user check their dashboard.
                    clearInterval(pollInterval);
                    toast.error(
                      'Payment received but escrow setup is taking longer than expected. Check your dashboard — your deed will appear once confirmed.',
                      { id: 'verify-payment', duration: 8000 }
                    );
                    setShowFundingModal(false);
                    navigate('/buyer/dashboard');
                  }
                } catch (pollErr) {
                  console.error('Polling error:', pollErr);
                  if (attempts >= MAX_ATTEMPTS) {
                    clearInterval(pollInterval);
                    toast.error(
                      'Payment received but we could not confirm deed status. Please check your dashboard.',
                      { id: 'verify-payment', duration: 8000 }
                    );
                    setShowFundingModal(false);
                    navigate('/buyer/dashboard');
                  }
                }
              }, 3000);
            } catch (err) {
              toast.error(
                err.response?.data?.message || 'Payment verification failed. Your payment is safe — please check your dashboard.',
                { id: 'verify-payment' }
              );
            }
          },
          prefill: { name: buyerData?.firstName ? `${buyerData.firstName} ${buyerData.lastName}` : '', email: buyerData?.email || '', contact: buyerData?.phone || '' },
          theme: { color: '#4f46e5' }
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (res) { toast.error('Payment failed: ' + res.error.description); });
        rzp.open();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment initialization failed.');
    } finally {
      setFundingLoading(false);
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds} sec ago`;
    return `${Math.floor(seconds/60)} min ago`;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-dark-bg pb-24 font-inter">
      {/* 4. Minimalist Hero (Height reduced by ~60%) */}
      <div className="bg-white dark:bg-dark-surface border-b border-neutral-200 dark:border-dark-border pt-8 pb-6 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/buyer/dashboard" className="inline-flex items-center text-neutral-500 dark:text-dark-muted hover:text-navy-900 dark:hover:text-dark-primary dark:text-dark-primary mb-4 transition-colors text-sm font-medium">
            <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> Back to Dashboard
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-black text-navy-900 dark:text-dark-primary tracking-tight mb-1">Create Secure Agreement</h1>
              <p className="text-neutral-500 dark:text-dark-muted text-sm">Create a legally binding escrow agreement.</p>
            </div>
            
            {/* Horizontal 4-Stage Progress Stepper */}
            {!showSuccess && (
              <div className="flex items-center w-full max-w-md">
                {[
                  { num: 1, label: 'PROJECT' },
                  { num: 2, label: 'SCOPE' },
                  { num: 3, label: 'REVIEW' },
                  { num: 4, label: 'PAYMENT' }
                ].map((s, i, arr) => (
                  <React.Fragment key={s.num}>
                    <div 
                      className={`flex flex-col items-center cursor-pointer transition-opacity ${step === s.num ? 'opacity-100' : 'opacity-60'}`}
                      onClick={() => {
                        if (s.num === 1) setStep(1);
                        if (s.num === 2 && validateStage1()) setStep(2);
                        if (s.num === 3 && validateStage1() && validateStage2()) setStep(3);
                        if (s.num === 4 && validateStage3()) setStep(4);
                      }}
                    >
                      <div className={`text-xs font-black tracking-widest ${step >= s.num ? 'text-indigo-600' : 'text-neutral-400 dark:text-dark-muted'}`}>
                        {s.label}
                      </div>
                      <div className={`h-1.5 w-16 mt-2 rounded-full transition-colors ${step >= s.num ? 'bg-indigo-600' : 'bg-neutral-200'}`}></div>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="flex-1 px-2 mb-[-8px]">
                         <div className={`h-[2px] w-full ${step > s.num ? 'bg-indigo-600' : 'bg-neutral-200'}`}></div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Main Form Area */}
          <div className="lg:col-span-8">
            {/* Stage 1: Project */}
            {step === 1 && !showSuccess && (
              <div className="animate-fadeIn space-y-10">
                <section>
                  <h2 className="text-sm font-black text-neutral-400 dark:text-dark-muted uppercase tracking-widest mb-6 pb-2 border-b border-neutral-200 dark:border-dark-border">Project Information</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-navy-900 dark:text-dark-primary mb-2">Project Title</label>
                      <input
                        name="title" value={form.title} onChange={handleInput} placeholder="e.g. Redesign Landing Page"
                        className="w-full px-5 py-4 bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-navy-900 dark:text-dark-primary placeholder:text-neutral-400 dark:text-dark-muted text-lg shadow-sm"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-navy-900 dark:text-dark-primary mb-2">Platform</label>
                        <input
                          name="platform" value={form.scopeBox.platform} onChange={handleScopeInput} placeholder="e.g. Freelancer, Upwork"
                          className="w-full px-5 py-4 bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-navy-900 dark:text-dark-primary placeholder:text-neutral-400 dark:text-dark-muted shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-navy-900 dark:text-dark-primary mb-2">Seller Contact</label>
                        <input
                          name="sellerContact" value={form.scopeBox.sellerContact} onChange={handleScopeInput} placeholder="Email or Profile URL"
                          className="w-full px-5 py-4 bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-navy-900 dark:text-dark-primary placeholder:text-neutral-400 dark:text-dark-muted shadow-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-navy-900 dark:text-dark-primary mb-2">Detailed Description</label>
                      <textarea
                        name="description" value={form.description} onChange={handleInput} placeholder="Describe the project goals and requirements..."
                        rows={5}
                        className="w-full px-5 py-4 bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-navy-900 dark:text-dark-primary placeholder:text-neutral-400 dark:text-dark-muted resize-y shadow-sm"
                      />
                    </div>
                  </div>
                </section>

                <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-dark-border">
                  <button
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                    disabled={!validateStage1()}
                    onClick={() => setStep(2)}
                  >
                    Continue to ScopeBox <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Stage 2: ScopeBox */}
            {step === 2 && !showSuccess && (
              <div className="animate-fadeIn space-y-10">
                <section>
                  <h2 className="text-sm font-black text-neutral-400 dark:text-dark-muted uppercase tracking-widest mb-6 pb-2 border-b border-neutral-200 dark:border-dark-border">ScopeBox details</h2>
                  <div className="space-y-6">
                    
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="block text-sm font-bold text-navy-900 dark:text-dark-primary">Acceptance Criteria</label>
                        <span className={`text-xs font-bold ${form.acceptanceCriteria.length < 50 ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'}`}>{form.acceptanceCriteria.length} / 50 min</span>
                      </div>
                      <textarea
                        name="acceptanceCriteria" value={form.acceptanceCriteria} onChange={handleInput} placeholder="How do you define 'done'? (e.g. I need 3 logo concepts in PNG format...)"
                        rows={4}
                        className={`w-full px-5 py-4 bg-white dark:bg-dark-surface border rounded-xl focus:ring-4 transition-all text-navy-900 dark:text-dark-primary placeholder:text-neutral-400 dark:text-dark-muted shadow-sm ${form.acceptanceCriteria.length > 0 && form.acceptanceCriteria.length < 50 ? 'border-red-300 dark:border-red-500/50 focus:ring-red-500/10 dark:focus:ring-red-500/20 focus:border-red-500 dark:focus:border-red-400' : 'border-neutral-200 dark:border-dark-border focus:ring-indigo-500/10 focus:border-indigo-500'}`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-navy-900 dark:text-dark-primary mb-2">Delivery Deadline</label>
                        <input
                          type="date" name="deadline" value={form.deadline} onChange={handleInput} min={new Date().toISOString().split('T')[0]}
                          className="w-full px-5 py-4 bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-navy-900 dark:text-dark-primary shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-navy-900 dark:text-dark-primary mb-2">Revision Limit</label>
                        <input
                          type="number" name="revisionLimit" value={form.revisionLimit} onChange={handleInput} placeholder="e.g. 2" min="0"
                          className="w-full px-5 py-4 bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-navy-900 dark:text-dark-primary shadow-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-navy-900 dark:text-dark-primary mb-2">Deliverable Formats</label>
                      <input
                        type="text" name="deliverableFormats" value={form.deliverableFormats} onChange={handleInput} placeholder="e.g. PNG, PDF, ZIP (comma separated)"
                        className="w-full px-5 py-4 bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-navy-900 dark:text-dark-primary shadow-sm"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-6 pb-2 border-b border-neutral-200 dark:border-dark-border">
                    <h2 className="text-sm font-black text-neutral-400 dark:text-dark-muted uppercase tracking-widest">Milestones</h2>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" name="isMilestone" checked={form.isMilestone} onChange={handleInput} className="sr-only peer" />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-dark-surface after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {form.isMilestone && (
                    <div className="space-y-6">
                      {form.milestones.map((m, idx) => (
                        <div key={idx} className="p-6 border border-neutral-200 dark:border-dark-border rounded-2xl bg-white dark:bg-dark-surface shadow-sm relative">
                          <button onClick={() => removeMilestone(idx)} className="absolute top-6 right-6 text-neutral-400 dark:text-dark-muted hover:text-red-500 dark:hover:text-red-400 text-sm font-bold transition-colors flex items-center">Remove</button>
                          <h4 className="font-black text-navy-900 dark:text-dark-primary mb-4">Milestone {idx + 1}</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-neutral-500 dark:text-dark-muted mb-1">Title *</label>
                              <input value={m.title} onChange={(e) => updateMilestone(idx, 'title', e.target.value)} className="w-full px-4 py-3 border border-neutral-200 dark:border-dark-border rounded-lg text-sm bg-neutral-50 dark:bg-dark-bg focus:bg-white dark:bg-dark-surface focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-neutral-500 dark:text-dark-muted mb-1">Amount *</label>
                              <input type="number" value={m.amount} onChange={(e) => updateMilestone(idx, 'amount', e.target.value)} className="w-full px-4 py-3 border border-neutral-200 dark:border-dark-border rounded-lg text-sm bg-neutral-50 dark:bg-dark-bg focus:bg-white dark:bg-dark-surface focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-bold text-neutral-500 dark:text-dark-muted mb-1">Acceptance Criteria</label>
                              <textarea value={m.acceptanceCriteria} onChange={(e) => updateMilestone(idx, 'acceptanceCriteria', e.target.value)} rows={2} className="w-full px-4 py-3 border border-neutral-200 dark:border-dark-border rounded-lg text-sm bg-neutral-50 dark:bg-dark-bg focus:bg-white dark:bg-dark-surface focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-neutral-500 dark:text-dark-muted mb-1">Deadline *</label>
                              <input type="date" value={m.deadline} onChange={(e) => updateMilestone(idx, 'deadline', e.target.value)} className="w-full px-4 py-3 border border-neutral-200 dark:border-dark-border rounded-lg text-sm bg-neutral-50 dark:bg-dark-bg focus:bg-white dark:bg-dark-surface focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button onClick={addMilestone} className="w-full py-4 border-2 border-dashed border-neutral-300 hover:border-indigo-400 rounded-2xl text-indigo-600 font-bold transition-colors flex items-center justify-center">
                        + Add Milestone Chunk
                      </button>
                    </div>
                  )}
                </section>

                <div className="flex justify-between pt-4 border-t border-neutral-200 dark:border-dark-border">
                  <button className="px-6 py-4 text-neutral-500 dark:text-dark-muted font-bold hover:text-navy-900 dark:hover:text-dark-primary dark:text-dark-primary transition-colors" onClick={() => setStep(1)}>Back</button>
                  <button
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                    disabled={!validateStage2()}
                    onClick={() => setStep(3)}
                  >
                    Review Agreement <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Stage 3: Review */}
            {step === 3 && !showSuccess && (
              <div className="animate-fadeIn space-y-10">
                <section>
                  <h2 className="text-sm font-black text-neutral-400 dark:text-dark-muted uppercase tracking-widest mb-6 pb-2 border-b border-neutral-200 dark:border-dark-border">Review & Validate</h2>
                  
                  <div className="bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border shadow-sm rounded-2xl p-8 mb-8">
                    <h3 className="text-xl font-black text-navy-900 dark:text-dark-primary mb-6 font-inter">{form.title}</h3>
                    <div className="space-y-6">
                      <div>
                        <div className="text-xs font-bold text-neutral-400 dark:text-dark-muted uppercase tracking-wider mb-1">Description</div>
                        <p className="text-neutral-700 text-sm leading-relaxed">{form.description}</p>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-400 dark:text-dark-muted uppercase tracking-wider mb-1">Acceptance Criteria</div>
                        <p className="text-neutral-700 text-sm leading-relaxed bg-neutral-50 dark:bg-dark-bg p-4 rounded-xl border border-neutral-100 dark:border-dark-border">{form.acceptanceCriteria}</p>
                      </div>
                    </div>
                  </div>
                  
                  
                  <div className="bg-neutral-50 dark:bg-dark-bg border border-neutral-200 dark:border-dark-border rounded-xl p-5 mb-8 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="isReviewed"
                      name="isReviewed"
                      checked={!!form.isReviewed}
                      onChange={handleInput}
                      className="mt-1 w-5 h-5 text-indigo-600 border-neutral-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="isReviewed" className="text-sm font-medium text-navy-900 dark:text-dark-primary cursor-pointer select-none">
                      I have reviewed the project details and acceptance criteria. I confirm they accurately represent the agreement.
                    </label>
                  </div>
                  
                  {getMissingFields().length > 0 && (
                     <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl p-5 mb-8">
                       <h4 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-2"><AlertTriangle size={18} /> Missing Information</h4>
                       <ul className="list-disc pl-5 text-sm text-red-600 dark:text-red-400 space-y-1">
                         {getMissingFields().map((err, i) => <li key={i}>{err}</li>)}
                       </ul>
                     </div>
                  )}
                </section>

                <div className="flex justify-between pt-4 border-t border-neutral-200 dark:border-dark-border">
                  <button className="px-6 py-4 text-neutral-500 dark:text-dark-muted font-bold hover:text-navy-900 dark:hover:text-dark-primary dark:text-dark-primary transition-colors" onClick={() => setStep(2)}>Back</button>
                  <button
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                    disabled={!validateStage3()}
                    onClick={() => setStep(4)}
                  >
                    Proceed to Securing <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Stage 4: Payment */}
            {step === 4 && !showSuccess && (
              <div className="animate-fadeIn space-y-10">
                <section>
                  <h2 className="text-sm font-black text-neutral-400 dark:text-dark-muted uppercase tracking-widest mb-6 pb-2 border-b border-neutral-200 dark:border-dark-border">Payment & Escrow</h2>
                  
                  <div className="bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border shadow-sm rounded-2xl p-8 mb-8 space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className="block text-sm font-bold text-navy-900 dark:text-dark-primary mb-2">Currency *</label>
                        <select
                          name="currency" value={form.currency} onChange={handleInput}
                          className="w-full px-5 py-4 bg-neutral-50 dark:bg-dark-bg border border-neutral-200 dark:border-dark-border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-navy-900 dark:text-dark-primary"
                        >
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-navy-900 dark:text-dark-primary mb-2">Total Amount *</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <span className="text-neutral-500 dark:text-dark-muted font-black">{form.currency === 'INR' ? '₹' : '$'}</span>
                          </div>
                          <input
                            type="number" name="amount" value={form.amount} onChange={handleInput} placeholder="0.00" min="0"
                            className="w-full pl-12 pr-5 py-4 bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-black text-navy-900 dark:text-dark-primary text-xl shadow-sm"
                          />
                        </div>
                        {form.isMilestone && (
                          <div className={`text-sm mt-3 font-bold flex items-center gap-1.5 ${!isMilestoneMathValid() ? 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-100 dark:border-red-900/50' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {!isMilestoneMathValid() ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                            Milestone sum: {getTotalMilestoneAmount()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <div className="flex justify-between pt-4 border-t border-neutral-200 dark:border-dark-border">
                  <button className="px-6 py-4 text-neutral-500 dark:text-dark-muted font-bold hover:text-navy-900 dark:hover:text-dark-primary dark:text-dark-primary transition-colors" onClick={() => setStep(3)}>Back</button>
                  <button
                    className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                    disabled={!validateStage4() || loading}
                    onClick={handleSubmit}
                  >
                    {loading ? <><RefreshCcw size={18} className="animate-spin" /> Submitting...</> : <>Submit & Secure Escrow <Lock size={18} /></>}
                  </button>
                </div>
              </div>
            )}

            {/* Success Screen */}
            {showSuccess && deedData && (
              <div className="bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-3xl p-16 text-center shadow-sm animate-fadeIn">
                <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-8 text-5xl text-emerald-500 dark:text-emerald-400 shadow-inner">
                  <Check />
                </div>
                <h2 className="text-4xl font-black text-navy-900 dark:text-dark-primary font-inter mb-4">Deed Secured!</h2>
                <p className="text-neutral-500 dark:text-dark-muted text-lg max-w-lg mx-auto mb-10">
                  Funds are locked in escrow. Share this invite link with the seller to start work.
                </p>

                <div className="bg-neutral-50 dark:bg-dark-bg border border-neutral-200 dark:border-dark-border rounded-2xl p-6 mb-10 max-w-lg mx-auto text-left shadow-sm">
                  <label className="text-xs font-bold text-neutral-500 dark:text-dark-muted uppercase tracking-widest mb-2 block">Secure Invite Link</label>
                  <div className="flex gap-2">
                    <input 
                      readOnly value={`${window.location.origin}/deed/invite/${deedData.inviteToken}`}
                      className="flex-1 px-4 py-3 border border-neutral-200 dark:border-dark-border rounded-xl text-sm bg-white dark:bg-dark-surface text-navy-900 dark:text-dark-primary font-bold focus:outline-none focus:border-indigo-300"
                    />
                    <button 
                      onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/deed/invite/${deedData.inviteToken}`); toast.success('Copied!'); }}
                      className="px-6 py-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-black text-sm rounded-xl transition-colors shrink-0"
                    >Copy</button>
                  </div>
                </div>

                <button onClick={() => navigate('/buyer/dashboard')} className="px-10 py-4 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl transition-all shadow-lg hover:-translate-y-0.5">
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Live Agreement Panel */}
          {!showSuccess && (
            <div className="lg:col-span-4 lg:sticky lg:top-32 animate-fadeIn space-y-6">
              
              {/* Contract Preview Card */}
              <div className="bg-white dark:bg-dark-surface border-2 border-neutral-900 rounded-2xl shadow-[8px_8px_0px_0px_rgba(23,23,23,1)] overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(23,23,23,1)]">
                <div className="bg-neutral-900 px-6 py-5">
                  <div className="text-[10px] font-black text-neutral-400 dark:text-dark-muted uppercase tracking-[0.2em] mb-1">Live Agreement Preview</div>
                  <h3 className="font-black text-white text-xl truncate tracking-tight uppercase">
                    {form.title || 'UNTITLED'}
                  </h3>
                </div>
                
                <div className="p-6 space-y-5 bg-[#FAFAFA] dark:bg-dark-bg">
                  <div className="flex justify-between items-start pb-4 border-b border-neutral-200 dark:border-dark-border border-dashed">
                    <div className="text-xs font-black text-neutral-500 dark:text-dark-muted uppercase tracking-widest">Buyer</div>
                    <div className="text-sm font-bold text-navy-900 dark:text-dark-primary">{buyerData?.firstName} {buyerData?.lastName}</div>
                  </div>
                  <div className="flex justify-between items-start pb-4 border-b border-neutral-200 dark:border-dark-border border-dashed">
                    <div className="text-xs font-black text-neutral-500 dark:text-dark-muted uppercase tracking-widest">Seller</div>
                    <div className="text-sm font-bold text-navy-900 dark:text-dark-primary max-w-[150px] truncate">{form.scopeBox.sellerContact || 'Pending'}</div>
                  </div>
                  <div className="flex justify-between items-start pb-4 border-b border-neutral-200 dark:border-dark-border border-dashed">
                    <div className="text-xs font-black text-neutral-500 dark:text-dark-muted uppercase tracking-widest">Escrow</div>
                    <div className="text-sm font-black text-indigo-600">
                      {form.amount ? formatCurrency(form.amount, form.currency) : 'Pending'}
                    </div>
                  </div>
                  <div className="flex justify-between items-start pb-4 border-b border-neutral-200 dark:border-dark-border border-dashed">
                    <div className="text-xs font-black text-neutral-500 dark:text-dark-muted uppercase tracking-widest">Deadline</div>
                    <div className="text-sm font-bold text-navy-900 dark:text-dark-primary">{form.deadline || 'Pending'}</div>
                  </div>
                  <div className="flex justify-between items-start pb-4 border-b border-neutral-200 dark:border-dark-border border-dashed">
                    <div className="text-xs font-black text-neutral-500 dark:text-dark-muted uppercase tracking-widest">Status</div>
                    <div className="text-xs font-black px-2 py-1 bg-neutral-200 text-neutral-600 dark:text-dark-muted rounded">DRAFT</div>
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex justify-between items-end mb-2">
                      <div className="text-xs font-black text-neutral-500 dark:text-dark-muted uppercase tracking-widest">ScopeBox</div>
                      <div className="text-xs font-black text-indigo-600">{calculateScopeBoxCompletion()}%</div>
                    </div>
                    <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 transition-all duration-500 ease-out" style={{ width: `${calculateScopeBoxCompletion()}%` }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-dark-surface px-6 py-4 border-t-2 border-neutral-900 flex items-center justify-between text-xs font-bold text-neutral-500 dark:text-dark-muted">
                  <div className="flex items-center gap-1.5"><Save size={14} /> Autosave active</div>
                  <div>{timeAgo(saveTime)}</div>
                </div>
              </div>

              {/* Missing Fields Widget (Only show if there are actual missing fields from earlier stages) */}
              {getMissingFields().length > 0 && step > 2 && (
                 <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-500/50 rounded-r-xl p-5 shadow-sm">
                   <h4 className="font-bold text-red-700 dark:text-red-400 text-sm mb-2 uppercase tracking-wide">Action Required</h4>
                   <p className="text-xs text-red-600 dark:text-red-400 font-medium">You have incomplete fields in previous stages. Review is locked.</p>
                 </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Funding Modal (Unchanged) */}
      {showFundingModal && deedData && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-surface rounded-3xl shadow-2xl p-8 max-w-md w-full border border-neutral-100 dark:border-dark-border animate-fadeIn">
            <h3 className="text-2xl font-bold text-navy-900 dark:text-dark-primary font-inter mb-2 text-center">Fund Escrow</h3>
            <p className="text-neutral-500 dark:text-dark-muted font-inter text-sm text-center mb-6">Complete payment to secure your order.</p>

            <div className="bg-neutral-50 dark:bg-dark-bg rounded-2xl p-6 mb-8 text-center border border-neutral-200 dark:border-dark-border">
              <div className="text-sm font-semibold text-neutral-500 dark:text-dark-muted font-inter mb-2 uppercase tracking-wider">Total to Pay</div>
              <div className="text-4xl font-bold text-navy-900 dark:text-dark-primary font-inter">{formatCurrency(deedData.amount, deedData.currency)}</div>
            </div>

            <button 
              onClick={handleFundingSubmit} 
              disabled={fundingLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5"
            >
              {fundingLoading ? <><RefreshCcw size={18} className="animate-spin" /> Processing...</> : `Pay securely via Razorpay`}
            </button>
          </div>
        </div>
      )}
      <KYCModal isOpen={showKycModal} onClose={() => setShowKycModal(false)} onComplete={() => window.location.reload()} />
    </div>
  );
}
