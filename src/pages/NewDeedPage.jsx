import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import KYCModal from '../components/KYCModal';

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
  
  const [form, setForm] = useState({
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
  });

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
        amount: parseFloat(form.amount),
        currency: form.currency,
        deadline: form.deadline,
        revisionLimit: parseInt(form.revisionLimit) || 0,
        deliverableFormats: form.deliverableFormats.split(',').map(s => s.trim()).filter(Boolean),
        isMilestone: form.isMilestone,
        milestones: form.isMilestone ? form.milestones : [],
        scopeBox: form.scopeBox,
        transactionType: 'SERVICE'
      };

      const res = await axios.post('/api/deeds', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
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
      
      // 1. Create Razorpay order on backend
      const fundResponse = await axios.post(`/api/deeds/${deedData.id}/fund`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (fundResponse.data.success && fundResponse.data.data.razorpayOrderId) {
        const { razorpayOrderId, amount, currency } = fundResponse.data.data;
        
        // 2. Open Razorpay Checkout modal
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TAVbIcT7jdp31E', 
          amount: amount,
          currency: currency,
          name: 'ScrowX',
          description: `Fund Escrow for Deed: ${deedData.title}`,
          order_id: razorpayOrderId,
          handler: async function (response) {
            try {
              toast.loading('Verifying payment...', { id: 'verify-payment' });
              const verifyRes = await axios.post(`/api/deeds/${deedData.id}/verify-payment`, {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });

              if (verifyRes.data.success) {
                 toast.success('Payment successful! Escrow funded.', { id: 'verify-payment' });
                 setShowFundingModal(false);
                 setShowSuccess(true);
              } else {
                 toast.error(`Payment verification failed: ${verifyRes.data.message}`, { id: 'verify-payment' });
              }
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
      <div className="bg-navy-900 pt-8 pb-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/buyer/dashboard" className="inline-flex items-center text-indigo-200 hover:text-white mb-6 transition-colors font-inter text-sm font-medium">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white font-inter tracking-tight mb-2">Create New Deed</h1>
          <p className="text-indigo-200 font-inter text-sm md:text-base max-w-2xl">
            Formalize your agreement and secure funds in escrow.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24">
        {/* Progress Steps */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 mb-6 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-neutral-100"></div>
          <div className="absolute top-0 left-0 h-1 bg-indigo-600 transition-all duration-500 ease-in-out" style={{ width: step === 1 ? '50%' : '100%' }}></div>
          
          <div className="flex items-center w-full max-w-sm mx-auto justify-between px-8">
            <div className={`flex flex-col items-center cursor-pointer transition-colors ${step >= 1 ? 'text-indigo-600' : 'text-neutral-400'}`} onClick={() => !showSuccess && setStep(1)}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-1 ${step >= 1 ? 'bg-indigo-100' : 'bg-neutral-100'}`}>1</div>
              <span className="text-xs font-semibold font-inter uppercase tracking-wide">Details</span>
            </div>
            
            <div className={`w-16 h-px ${step >= 2 ? 'bg-indigo-600' : 'bg-neutral-300'}`}></div>
            
            <div className={`flex flex-col items-center cursor-pointer transition-colors ${step >= 2 ? 'text-indigo-600' : 'text-neutral-400'}`} onClick={() => !showSuccess && validateStep1() && setStep(2)}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-1 ${step >= 2 ? 'bg-indigo-100' : 'bg-neutral-100'}`}>2</div>
              <span className="text-xs font-semibold font-inter uppercase tracking-wide">Review & Pay</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden relative">
          
          {/* Step 1: Order Details */}
          {step === 1 && !showSuccess && (
            <div className="p-6 md:p-10 space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold text-navy-900 font-inter mb-1">Project Details</h2>
                <p className="text-neutral-500 font-inter text-sm mb-6">Describe the task, timeline, and requirements.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-navy-900 font-inter mb-2">Project Title *</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleInput}
                    placeholder="e.g. Redesign Landing Page"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-inter shadow-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-navy-900 font-inter mb-2">Platform *</label>
                  <input
                    name="platform"
                    value={form.scopeBox.platform}
                    onChange={handleScopeInput}
                    placeholder="e.g. Freelancer, Upwork, Discord"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-inter shadow-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-navy-900 font-inter mb-2">Seller Contact *</label>
                  <input
                    name="sellerContact"
                    value={form.scopeBox.sellerContact}
                    onChange={handleScopeInput}
                    placeholder="Email or Profile URL"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-inter shadow-sm"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-navy-900 font-inter mb-2">Detailed Description *</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleInput}
                    placeholder="Describe the project scope in detail..."
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-inter shadow-sm"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-navy-900 font-inter mb-2">Acceptance Criteria * (Min 50 chars)</label>
                  <textarea
                    name="acceptanceCriteria"
                    value={form.acceptanceCriteria}
                    onChange={handleInput}
                    placeholder="How do you define 'done'? (e.g. I need 3 logo concepts in PNG format, with source files provided, passing all tests...)"
                    rows={3}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-inter shadow-sm"
                  />
                  <div className={`text-xs mt-1 font-inter ${form.acceptanceCriteria.length < 50 ? 'text-red-500' : 'text-green-500'}`}>
                    {form.acceptanceCriteria.length} / 50 minimum characters
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-navy-900 font-inter mb-2">Delivery Deadline *</label>
                  <input
                    type="date"
                    name="deadline"
                    value={form.deadline}
                    onChange={handleInput}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-inter shadow-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-navy-900 font-inter mb-2">Revision Limit</label>
                  <input
                    type="number"
                    name="revisionLimit"
                    value={form.revisionLimit}
                    onChange={handleInput}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-inter shadow-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-navy-900 font-inter mb-2">Deliverable Formats</label>
                  <input
                    type="text"
                    name="deliverableFormats"
                    value={form.deliverableFormats}
                    onChange={handleInput}
                    placeholder="e.g. PNG, PDF, ZIP (comma separated)"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-inter shadow-sm"
                  />
                </div>
              </div>

              {/* Milestones Toggle */}
              <div className="border-t border-neutral-200 pt-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-navy-900 font-inter">Milestone Based Work?</h3>
                    <p className="text-sm text-neutral-500 font-inter">Break the project into smaller, payable chunks.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="isMilestone" checked={form.isMilestone} onChange={handleInput} className="sr-only peer" />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {form.isMilestone && (
                  <div className="space-y-4">
                    {form.milestones.map((m, idx) => (
                      <div key={idx} className="p-4 border border-neutral-200 rounded-xl bg-neutral-50 relative">
                        <button onClick={() => removeMilestone(idx)} className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-bold font-inter">Remove</button>
                        <h4 className="font-semibold text-navy-900 font-inter mb-3">Milestone {idx + 1}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-navy-900 font-inter mb-1">Title *</label>
                            <input value={m.title} onChange={(e) => updateMilestone(idx, 'title', e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-navy-900 font-inter mb-1">Amount *</label>
                            <input type="number" value={m.amount} onChange={(e) => updateMilestone(idx, 'amount', e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-navy-900 font-inter mb-1">Acceptance Criteria</label>
                            <textarea value={m.acceptanceCriteria} onChange={(e) => updateMilestone(idx, 'acceptanceCriteria', e.target.value)} rows={2} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-navy-900 font-inter mb-1">Deadline *</label>
                            <input type="date" value={m.deadline} onChange={(e) => updateMilestone(idx, 'deadline', e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={addMilestone} className="text-indigo-600 font-inter text-sm font-semibold hover:text-indigo-800">+ Add Milestone</button>
                  </div>
                )}
              </div>

              <div className="pt-6 flex justify-end border-t border-neutral-200">
                <button
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 font-inter"
                  disabled={!validateStep1()}
                  onClick={() => setStep(2)}
                >
                  Next: Review & Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && !showSuccess && (
            <div className="p-6 md:p-10 space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold text-navy-900 font-inter mb-1">Review & Payment</h2>
                <p className="text-neutral-500 font-inter text-sm mb-6">Set the final price and securely lock in the terms.</p>
              </div>

              <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200">
                <h3 className="font-semibold text-navy-900 font-inter mb-4 border-b border-neutral-200 pb-2">Deed Summary</h3>
                <div className="space-y-2 text-sm font-inter text-neutral-700">
                  <div className="flex justify-between">
                    <span>Project:</span> <span className="font-medium text-navy-900">{form.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deadline:</span> <span className="font-medium text-navy-900">{form.deadline}</span>
                  </div>
                  {form.isMilestone && (
                    <div className="flex justify-between">
                      <span>Milestones:</span> <span className="font-medium text-navy-900">{form.milestones.length} milestones</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-navy-900 font-inter mb-2">Currency *</label>
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleInput}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm font-inter"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 font-inter mb-2">Total Amount *</label>
                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleInput}
                    placeholder="0.00"
                    min="0"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm font-inter"
                  />
                  {form.isMilestone && (
                    <p className={`text-xs mt-1 ${Math.abs(getTotalMilestoneAmount() - parseFloat(form.amount || 0)) > 0.01 ? 'text-red-500' : 'text-green-500'}`}>
                      Milestone sum: {getTotalMilestoneAmount()}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-6 flex justify-between border-t border-neutral-200">
                <button
                  className="px-6 py-3 border border-neutral-300 text-navy-900 rounded-xl font-medium hover:bg-neutral-50 font-inter transition-all"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 font-inter flex items-center"
                  disabled={!validateStep2() || loading}
                  onClick={handleSubmit}
                >
                  {loading ? 'Creating...' : 'Create Deed & Pay'}
                </button>
              </div>
            </div>
          )}

          {/* Success Screen */}
          {showSuccess && deedData && (
            <div className="p-10 text-center animate-fadeIn">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl text-green-500">
                ✓
              </div>
              <h2 className="text-3xl font-bold text-navy-900 font-inter mb-3">Deed Created & Funded!</h2>
              <p className="text-neutral-500 font-inter max-w-md mx-auto mb-8">
                Your funds are securely locked in escrow. Share this invite link with the seller to start the project.
              </p>

              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 mb-8 max-w-md mx-auto flex flex-col gap-3 text-left">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Invite Link</label>
                <div className="flex gap-2">
                  <input 
                    readOnly 
                    value={`${window.location.origin}/deed/invite/${deedData.inviteToken}`}
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/deed/invite/${deedData.inviteToken}`);
                      toast.success('Link copied!');
                    }}
                    className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold text-sm rounded-lg transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <button 
                onClick={() => navigate('/buyer/dashboard')}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl font-inter transition-all shadow-md"
              >
                Go to Dashboard
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Funding Modal */}
      {showFundingModal && deedData && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-navy-900 font-inter mb-2 text-center">Fund Escrow</h3>
            <p className="text-neutral-500 font-inter text-sm text-center mb-6">Complete payment to secure your order.</p>

            <div className="bg-neutral-50 rounded-xl p-5 mb-6 text-center border border-neutral-200">
              <div className="text-sm text-neutral-500 font-inter mb-1">Total to Pay</div>
              <div className="text-3xl font-bold text-navy-900 font-inter">{formatCurrency(deedData.amount, deedData.currency)}</div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleFundingSubmit} 
                disabled={fundingLoading}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {fundingLoading ? 'Processing...' : `Pay ${formatCurrency(deedData.amount, deedData.currency)} with Razorpay`}
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
