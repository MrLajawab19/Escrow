import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import KYCModal from '../components/KYCModal';
import { FileText, Monitor, User, Calendar, RefreshCcw, FileBox, ShieldCheck, Lock, ArrowRight, Check, X, AlertTriangle } from 'lucide-react';

export default function NewDeedPage() {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [step, setStep] = useState(1);
  const [buyerData, setBuyerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [deedData, setDeedData] = useState(null);
  
  const [kycStatus, setKycStatus] = useState({ phoneVerified: false, kycComplete: false, reviewStatus: 'PENDING' });
  const [showKycModal, setShowKycModal] = useState(false);
  
  // Autosave: load initial state from localStorage
  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem('scrowx_new_deed_draft');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error('Error parsing draft:', e); }
    }
    return {
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

  // Autosave: save to localStorage on change
  useEffect(() => {
    if (!showSuccess) {
      const saveDraft = setTimeout(() => {
        localStorage.setItem('scrowx_new_deed_draft', JSON.stringify(form));
      }, 1000);
      return () => clearTimeout(saveDraft);
    }
  }, [form, showSuccess]);

  // Funding state
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [fundingLoading, setFundingLoading] = useState(false);
  const [fundingData, setFundingData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');
    const data = localStorage.getItem('buyerData') || localStorage.getItem('userData');

    if (!token || !data) {
      navigate('/buyer/auth');
      return;
    }

    try {
      const parsedData = JSON.parse(data);
      setBuyerData(parsedData);
    } catch (error) {
      console.error('Error parsing buyer data:', error);
      navigate('/buyer/auth');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchKycStatus = async () => {
      try {
        const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/kyc/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setKycStatus(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch KYC status', err);
      }
    };
    fetchKycStatus();
  }, []);

  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleScopeInput = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      scopeBox: {
        ...prev.scopeBox,
        [name]: value
      }
    }));
  };

  const addMilestone = () => {
    setForm(prev => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        { title: '', description: '', acceptanceCriteria: '', amount: '', deadline: '' }
      ]
    }));
  };

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

  const getTotalMilestoneAmount = () => {
    return form.milestones.reduce((total, m) => total + (parseFloat(m.amount) || 0), 0);
  };

  const validateStep1 = () => {
    if (!form.title || !form.description || !form.acceptanceCriteria || !form.deadline || !form.scopeBox.platform || !form.scopeBox.sellerContact) return false;
    if (form.acceptanceCriteria.length < 50) return false;
    
    if (form.isMilestone) {
      if (form.milestones.length === 0) return false;
      for (const m of form.milestones) {
        if (!m.title || !m.amount || !m.deadline) return false;
      }
    }
    return true;
  };

  const validateStep2 = () => {
    if (!form.amount || !form.currency) return false;
    if (form.isMilestone) {
      const total = getTotalMilestoneAmount();
      if (Math.abs(total - parseFloat(form.amount)) > 0.01) return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      const res = await axios.post('/api/deeds', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        // Clear draft on success
        localStorage.removeItem('scrowx_new_deed_draft');
        setDeedData(res.data.data);
        setShowFundingModal(true);
      }
    } catch (err) {
      console.error(err);
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
      
      const fundResponse = await axios.post(`/api/wallet/top-up`, {
        amount: deedData.amount,
        targetDeedId: deedData.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (fundResponse.data.success && fundResponse.data.data.razorpayOrderId) {
        const { razorpayOrderId, amount, currency } = fundResponse.data.data;
        
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TAVbIcT7jdp31E', 
          amount: amount,
          currency: currency,
          name: 'ScrowX',
          description: `Fund Escrow for Deed: ${deedData.title}`,
          order_id: razorpayOrderId,
          handler: async function (response) {
            try {
              toast.loading('Payment received! Finishing setup, this may take a minute...', { id: 'verify-payment' });
              
              let attempts = 0;
              const maxAttempts = 20;
              const pollInterval = setInterval(async () => {
                attempts++;
                try {
                  const checkRes = await axios.get(`/api/deeds/${deedData.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  const status = checkRes.data.data?.status;
                  
                  if (status && status !== 'DRAFT') {
                    clearInterval(pollInterval);
                    toast.success('Payment successful! Escrow funded.', { id: 'verify-payment' });
                    setShowFundingModal(false);
                    setShowSuccess(true);
                  } else if (attempts >= maxAttempts) {
                    clearInterval(pollInterval);
                    toast.success('Payment received! Finishing setup. Check your dashboard for status.', { id: 'verify-payment' });
                    setShowFundingModal(false);
                    setShowSuccess(true);
                  }
                } catch (pollErr) {
                  console.error('Polling error:', pollErr);
                  if (attempts >= maxAttempts) {
                    clearInterval(pollInterval);
                    toast.success('Payment received! Finishing setup. Check your dashboard for status.', { id: 'verify-payment' });
                    setShowFundingModal(false);
                    setShowSuccess(true);
                  }
                }
              }, 3000);
            } catch (err) {
              console.error('Verification error:', err);
              toast.error(err.response?.data?.message || 'Payment verification failed.', { id: 'verify-payment' });
            }
          },
          prefill: {
            name: buyerData?.firstName ? `${buyerData.firstName} ${buyerData.lastName}` : '',
            email: buyerData?.email || '',
            contact: buyerData?.phone || ''
          },
          theme: {
            color: '#4f46e5'
          }
        };

        const rzp = new window.Razorpay(options);
        
        rzp.on('payment.failed', function (response) {
          console.error('Razorpay Payment Failed', response.error);
          toast.error('Payment failed: ' + response.error.description);
        });
        
        rzp.open();
      } else {
        toast.error('Failed to initiate escrow funding. Please try again.');
      }
    } catch (error) {
      console.error('Error funding escrow:', error);
      toast.error(error.response?.data?.message || 'Payment initialization failed. Please try again.');
    } finally {
      setFundingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Hero Section */}
      <div className="bg-navy-900 pt-6 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/buyer/dashboard" className="inline-flex items-center text-indigo-200 hover:text-white mb-8 transition-colors font-inter text-sm font-medium">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold text-white font-inter tracking-tight mb-3">Create New Deed</h1>
              <p className="text-indigo-200 font-inter text-base max-w-xl">
                Formalize your agreement and secure funds in escrow.
              </p>
            </div>
            
            {/* Stepper Component matching mockup */}
            {!showSuccess && (
              <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm md:w-[480px]">
                {/* Step 1 */}
                <div 
                  className={`flex items-center gap-3 ${step >= 1 ? 'cursor-pointer' : ''}`}
                  onClick={() => !showSuccess && setStep(1)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= 1 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-neutral-100 text-neutral-400'}`}>
                    {step > 1 ? <Check size={18} /> : 1}
                  </div>
                  <div>
                    <div className={`text-sm font-bold font-inter ${step >= 1 ? 'text-indigo-900' : 'text-neutral-500'}`}>Details</div>
                    <div className="text-xs text-neutral-500 font-inter">Project & Scope</div>
                  </div>
                </div>
                
                {/* Divider */}
                <div className="flex-1 mx-4">
                  <div className={`h-px w-full border-t-2 border-dashed ${step >= 2 ? 'border-indigo-600' : 'border-neutral-200'}`}></div>
                </div>
                
                {/* Step 2 */}
                <div 
                  className={`flex items-center gap-3 ${step >= 2 ? 'cursor-pointer' : ''}`}
                  onClick={() => !showSuccess && validateStep1() && setStep(2)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= 2 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-neutral-100 text-neutral-400'}`}>
                    2
                  </div>
                  <div>
                    <div className={`text-sm font-bold font-inter ${step >= 2 ? 'text-indigo-900' : 'text-neutral-500'}`}>Review & Pay</div>
                    <div className="text-xs text-neutral-500 font-inter">Confirm & Secure</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Main Form Area */}
          <div className="lg:col-span-8 bg-white rounded-3xl shadow-xl shadow-neutral-200/50 border border-neutral-100 overflow-hidden">
            {/* Step 1: Order Details */}
            {step === 1 && !showSuccess && (
              <div className="p-6 md:p-10 animate-fadeIn">
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-neutral-100">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-navy-900 font-inter">Project Details</h2>
                    <p className="text-neutral-500 font-inter text-sm">Provide all the essential information about your project.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7">
                  <div className="md:col-span-2 group">
                    <label className="block text-sm font-semibold text-navy-900 font-inter mb-2">Project Title *</label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleInput}
                      placeholder="e.g. Redesign Landing Page"
                      className="w-full px-4 py-3.5 bg-neutral-50/50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-inter text-navy-900 placeholder:text-neutral-400"
                    />
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-navy-900 font-inter mb-2">Platform *</label>
                    <input
                      name="platform"
                      value={form.scopeBox.platform}
                      onChange={handleScopeInput}
                      placeholder="e.g. Freelancer, Upwork, Discord"
                      className="w-full px-4 py-3.5 bg-neutral-50/50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-inter text-navy-900 placeholder:text-neutral-400"
                    />
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-navy-900 font-inter mb-2">Seller Contact *</label>
                    <input
                      name="sellerContact"
                      value={form.scopeBox.sellerContact}
                      onChange={handleScopeInput}
                      placeholder="Email or Profile URL"
                      className="w-full px-4 py-3.5 bg-neutral-50/50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-inter text-navy-900 placeholder:text-neutral-400"
                    />
                  </div>
                  
                  <div className="md:col-span-2 group">
                    <label className="block text-sm font-semibold text-navy-900 font-inter mb-2">Detailed Description *</label>
                    <div className="relative">
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleInput}
                        placeholder="Describe the project scope, goals, and key requirements in detail..."
                        rows={4}
                        maxLength={2000}
                        className="w-full px-4 py-3.5 bg-neutral-50/50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-inter text-navy-900 placeholder:text-neutral-400 resize-y min-h-[120px]"
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-neutral-400 font-inter bg-white/80 px-2 rounded-md">
                        {form.description.length} / 2000
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 group">
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-sm font-semibold text-navy-900 font-inter">Acceptance Criteria *</label>
                      <span className="text-xs text-neutral-500">(Min 50 chars)</span>
                    </div>
                    <div className="relative">
                      <textarea
                        name="acceptanceCriteria"
                        value={form.acceptanceCriteria}
                        onChange={handleInput}
                        placeholder="e.g. I need 3 logo concepts in PNG format, with source files provided, passing all tests..."
                        rows={3}
                        maxLength={500}
                        className={`w-full px-4 py-3.5 bg-neutral-50/50 border rounded-xl focus:ring-4 focus:ring-indigo-500/10 transition-all font-inter text-navy-900 placeholder:text-neutral-400 resize-y min-h-[100px] ${
                          form.acceptanceCriteria.length > 0 && form.acceptanceCriteria.length < 50 
                            ? 'border-red-300 focus:border-red-500' 
                            : 'border-neutral-200 focus:border-indigo-500'
                        }`}
                      />
                      <div className={`absolute bottom-3 right-3 text-xs font-inter px-2 rounded-md ${form.acceptanceCriteria.length > 0 && form.acceptanceCriteria.length < 50 ? 'text-red-500 bg-red-50' : 'text-neutral-400 bg-white/80'}`}>
                        {form.acceptanceCriteria.length} / 500
                      </div>
                    </div>
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-navy-900 font-inter mb-2">Delivery Deadline *</label>
                    <input
                      type="date"
                      name="deadline"
                      value={form.deadline}
                      onChange={handleInput}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3.5 bg-neutral-50/50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-inter text-navy-900"
                    />
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-navy-900 font-inter mb-2">Revision Limit</label>
                    <input
                      type="number"
                      name="revisionLimit"
                      value={form.revisionLimit}
                      onChange={handleInput}
                      placeholder="e.g. 2"
                      min="0"
                      className="w-full px-4 py-3.5 bg-neutral-50/50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-inter text-navy-900 placeholder:text-neutral-400"
                    />
                  </div>

                  <div className="md:col-span-2 group">
                    <label className="block text-sm font-semibold text-navy-900 font-inter mb-2">Deliverable Formats</label>
                    <input
                      type="text"
                      name="deliverableFormats"
                      value={form.deliverableFormats}
                      onChange={handleInput}
                      placeholder="e.g. PNG, PDF, ZIP (comma separated)"
                      className="w-full px-4 py-3.5 bg-neutral-50/50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-inter text-navy-900 placeholder:text-neutral-400"
                    />
                  </div>
                </div>

                {/* Milestones Toggle */}
                <div className="mt-10 pt-8 border-t border-neutral-100">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-navy-900 font-inter">Milestone Based Work?</h3>
                      <p className="text-sm text-neutral-500 font-inter">Break the project into smaller, payable chunks.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" name="isMilestone" checked={form.isMilestone} onChange={handleInput} className="sr-only peer" />
                      <div className="w-14 h-7 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {form.isMilestone && (
                    <div className="space-y-4 mb-4">
                      {form.milestones.map((m, idx) => (
                        <div key={idx} className="p-5 border border-neutral-200 rounded-2xl bg-neutral-50/50 relative group">
                          <button onClick={() => removeMilestone(idx)} className="absolute top-5 right-5 text-neutral-400 hover:text-red-500 text-sm font-medium font-inter transition-colors flex items-center gap-1">
                            <X size={16} /> Remove
                          </button>
                          <h4 className="font-semibold text-navy-900 font-inter mb-4">Milestone {idx + 1}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-navy-900 font-inter mb-1.5">Title *</label>
                              <input value={m.title} onChange={(e) => updateMilestone(idx, 'title', e.target.value)} className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-navy-900 font-inter mb-1.5">Amount *</label>
                              <input type="number" value={m.amount} onChange={(e) => updateMilestone(idx, 'amount', e.target.value)} className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs font-semibold text-navy-900 font-inter mb-1.5">Acceptance Criteria</label>
                              <textarea value={m.acceptanceCriteria} onChange={(e) => updateMilestone(idx, 'acceptanceCriteria', e.target.value)} rows={2} className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-navy-900 font-inter mb-1.5">Deadline *</label>
                              <input type="date" value={m.deadline} onChange={(e) => updateMilestone(idx, 'deadline', e.target.value)} className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button onClick={addMilestone} className="w-full py-4 border-2 border-dashed border-neutral-200 hover:border-indigo-300 rounded-2xl text-indigo-600 font-inter text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                        + Add Milestone
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none font-inter flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 hover:-translate-y-0.5"
                    disabled={!validateStep1()}
                    onClick={() => setStep(2)}
                  >
                    Next: Review & Payment <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && !showSuccess && (
              <div className="p-6 md:p-10 animate-fadeIn">
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-neutral-100">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Lock size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-navy-900 font-inter">Review & Payment</h2>
                    <p className="text-neutral-500 font-inter text-sm">Set the final price and securely lock in the terms.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-y-7 mb-10">
                  <div className="group">
                    <label className="block text-sm font-semibold text-navy-900 font-inter mb-2">Currency *</label>
                    <select
                      name="currency"
                      value={form.currency}
                      onChange={handleInput}
                      className="w-full px-4 py-3.5 bg-neutral-50/50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-inter text-navy-900"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-navy-900 font-inter mb-2">Total Amount *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-neutral-500 font-bold font-inter">{form.currency === 'INR' ? '₹' : '$'}</span>
                      </div>
                      <input
                        type="number"
                        name="amount"
                        value={form.amount}
                        onChange={handleInput}
                        placeholder="0.00"
                        min="0"
                        className="w-full pl-10 pr-4 py-3.5 bg-neutral-50/50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-inter text-navy-900 font-medium text-lg"
                      />
                    </div>
                    {form.isMilestone && (
                      <div className={`text-sm mt-2 font-medium flex items-center gap-1 ${Math.abs(getTotalMilestoneAmount() - parseFloat(form.amount || 0)) > 0.01 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {Math.abs(getTotalMilestoneAmount() - parseFloat(form.amount || 0)) > 0.01 ? (
                          <AlertTriangle size={14} />
                        ) : (
                          <Check size={14} />
                        )}
                        Milestone sum: {getTotalMilestoneAmount()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row justify-between gap-4 border-t border-neutral-100">
                  <button
                    className="px-6 py-4 border border-neutral-200 text-navy-900 rounded-xl font-bold hover:bg-neutral-50 hover:border-neutral-300 font-inter transition-all flex items-center justify-center gap-2"
                    onClick={() => setStep(1)}
                  >
                    Back to Details
                  </button>
                  <button
                    className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-inter flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 hover:-translate-y-0.5"
                    disabled={!validateStep2() || loading}
                    onClick={handleSubmit}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2"><RefreshCcw size={18} className="animate-spin" /> Creating...</span>
                    ) : (
                      <>Create Deed & Pay <ArrowRight size={18} /></>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Success Screen */}
            {showSuccess && deedData && (
              <div className="p-10 md:p-16 text-center animate-fadeIn">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 text-5xl text-emerald-500 shadow-inner">
                  <Check />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-navy-900 font-inter mb-4">Deed Created & Funded!</h2>
                <p className="text-neutral-500 font-inter text-lg max-w-lg mx-auto mb-10">
                  Your funds are securely locked in escrow. Share this invite link with the seller to start the project.
                </p>

                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 mb-10 max-w-lg mx-auto text-left shadow-sm">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Invite Link</label>
                  <div className="flex gap-2">
                    <input 
                      readOnly 
                      value={`${window.location.origin}/deed/invite/${deedData.inviteToken}`}
                      className="flex-1 px-4 py-3 border border-neutral-200 rounded-xl text-sm bg-white text-navy-900 font-medium focus:outline-none focus:border-indigo-300"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/deed/invite/${deedData.inviteToken}`);
                        toast.success('Link copied!');
                      }}
                      className="px-6 py-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold text-sm rounded-xl transition-colors shrink-0"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/buyer/dashboard')}
                  className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl font-inter transition-all shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 hover:-translate-y-0.5"
                >
                  Go to Dashboard
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Reactive Summary & Info Cards */}
          {!showSuccess && (
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              
              {/* Reactive Deed Summary */}
              <div className="bg-white rounded-3xl shadow-xl shadow-neutral-200/50 border border-neutral-100 p-6 animate-fadeIn">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-900 font-inter leading-tight">Deed Summary</h3>
                    <p className="text-xs text-neutral-500 font-inter">Preview of your agreement</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FileBox size={16} className="text-neutral-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-0.5">Project Title</div>
                      <div className={`text-sm font-medium font-inter ${form.title ? 'text-navy-900' : 'text-neutral-400 italic'}`}>
                        {form.title || 'Not provided'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Monitor size={16} className="text-neutral-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-0.5">Platform</div>
                      <div className={`text-sm font-medium font-inter ${form.scopeBox.platform ? 'text-navy-900' : 'text-neutral-400 italic'}`}>
                        {form.scopeBox.platform || 'Not provided'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User size={16} className="text-neutral-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-0.5">Seller Contact</div>
                      <div className={`text-sm font-medium font-inter ${form.scopeBox.sellerContact ? 'text-navy-900 break-all' : 'text-neutral-400 italic'}`}>
                        {form.scopeBox.sellerContact || 'Not provided'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar size={16} className="text-neutral-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-0.5">Delivery Deadline</div>
                      <div className={`text-sm font-medium font-inter ${form.deadline ? 'text-navy-900' : 'text-neutral-400 italic'}`}>
                        {form.deadline || 'Not provided'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <RefreshCcw size={16} className="text-neutral-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-0.5">Revision Limit</div>
                      <div className={`text-sm font-medium font-inter ${form.revisionLimit ? 'text-navy-900' : 'text-neutral-400 italic'}`}>
                        {form.revisionLimit || 'Not provided'}
                      </div>
                    </div>
                  </div>
                  
                  {form.isMilestone && (
                    <div className="flex items-start gap-3 pt-2 border-t border-neutral-100">
                      <Lock size={16} className="text-neutral-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-0.5">Milestones</div>
                        <div className="text-sm font-medium font-inter text-navy-900">
                          {form.milestones.length} defined chunks
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {step === 2 && (
                    <div className="flex items-start gap-3 pt-4 border-t border-neutral-100">
                      <ShieldCheck size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      <div className="w-full">
                        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">Total Securing Amount</div>
                        <div className="text-xl font-bold font-inter text-navy-900 bg-neutral-50 py-2 px-3 rounded-lg border border-neutral-200">
                          {form.amount ? formatCurrency(form.amount, form.currency) : '0.00'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Escrow Information Cards */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-2 text-emerald-700">
                  <ShieldCheck size={20} />
                  <h4 className="font-bold font-inter">Escrow Protection</h4>
                </div>
                <p className="text-sm text-emerald-800/80 font-inter leading-relaxed">
                  Your funds will be held securely in escrow until the work is completed and approved.
                </p>
              </div>

              <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-2 text-indigo-700">
                  <Lock size={20} />
                  <h4 className="font-bold font-inter">Why escrow?</h4>
                </div>
                <p className="text-sm text-indigo-800/80 font-inter leading-relaxed">
                  ScrowX protects both buyers and sellers by holding funds securely until the agreed work is delivered.
                </p>
              </div>
              
              <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-navy-900">
                  <Check size={20} className="text-emerald-500" />
                  <h4 className="font-bold font-inter">Secure & Transparent</h4>
                </div>
                <p className="text-sm text-neutral-500 font-inter leading-relaxed">
                  All agreements are legally binding and fully trackable through our secure ledger.
                </p>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Funding Modal */}
      {showFundingModal && deedData && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-neutral-100 animate-fadeIn">
            <h3 className="text-2xl font-bold text-navy-900 font-inter mb-2 text-center">Fund Escrow</h3>
            <p className="text-neutral-500 font-inter text-sm text-center mb-6">Complete payment to secure your order.</p>

            <div className="bg-neutral-50 rounded-2xl p-6 mb-8 text-center border border-neutral-200">
              <div className="text-sm font-semibold text-neutral-500 font-inter mb-2 uppercase tracking-wider">Total to Pay</div>
              <div className="text-4xl font-bold text-navy-900 font-inter">{formatCurrency(deedData.amount, deedData.currency)}</div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleFundingSubmit} 
                disabled={fundingLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5"
              >
                {fundingLoading ? (
                  <><RefreshCcw size={18} className="animate-spin" /> Processing...</>
                ) : (
                  `Pay securely via Razorpay`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <KYCModal 
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        onComplete={() => window.location.reload()}
      />
    </div>
  );
}
