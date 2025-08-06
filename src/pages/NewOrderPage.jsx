import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const platforms = ['Upwork', 'Fiverr', 'Freelancer', 'Other'];
const countries = ['India', 'USA', 'UK', 'Canada', 'Other'];
const currencies = ['USD', 'INR', 'EUR', 'GBP', 'Other'];
const productTypes = ['Logo Design', 'Website', 'App', 'Document', 'Video', 'Other'];
const conditions = ['New', 'Used', 'Refurbished', 'Other'];

export default function NewOrderPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [buyerData, setBuyerData] = useState(null);
  const [form, setForm] = useState({
    platform: '',
    productLink: '',
    country: '',
    currency: '',
    sellerContact: '',
    scopeBox: {
      title: '',
      productType: '',
      productLink: '',
      description: '',
      attachments: [],
      condition: '',
      deadline: '',
      price: '',
    },
  });
  const [filePreviews, setFilePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [fundingData, setFundingData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    amount: ''
  });
  const [fundingLoading, setFundingLoading] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('buyerToken');
    const data = localStorage.getItem('buyerData');
    
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

  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleScopeInput = (e) => {
    setForm({ ...form, scopeBox: { ...form.scopeBox, [e.target.name]: e.target.value } });
  };
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newFilePreviews = files.map(f => ({ name: f.name, type: f.type, size: f.size }));
    
    // Combine with existing files, avoiding duplicates
    const existingNames = filePreviews.map(f => f.name);
    const uniqueNewFiles = newFilePreviews.filter(f => !existingNames.includes(f.name));
    
    const combinedFiles = [...filePreviews, ...uniqueNewFiles];
    setFilePreviews(combinedFiles);
    setForm({ ...form, scopeBox: { ...form.scopeBox, attachments: combinedFiles } });
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const newFilePreviews = files.map(f => ({ name: f.name, type: f.type, size: f.size }));
    
    // Combine with existing files, avoiding duplicates
    const existingNames = filePreviews.map(f => f.name);
    const uniqueNewFiles = newFilePreviews.filter(f => !existingNames.includes(f.name));
    
    const combinedFiles = [...filePreviews, ...uniqueNewFiles];
    setFilePreviews(combinedFiles);
    setForm({ ...form, scopeBox: { ...form.scopeBox, attachments: combinedFiles } });
  };
  const handleDragOver = (e) => e.preventDefault();

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPrice = (price, currency) => {
    if (!price) return 'Not set';
    const currencySymbol = currency || 'USD';
    return `${currencySymbol} ${parseFloat(price).toFixed(2)}`;
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return 'Not set';
    return new Date(deadline).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const validateStep1 = () => form.platform && form.productLink && form.country && form.currency;
  const validateStep2 = () => form.scopeBox.title && form.scopeBox.productType && form.scopeBox.productLink && form.scopeBox.description && form.scopeBox.condition && form.scopeBox.deadline && form.scopeBox.price;
  const validateStep3 = () => form.sellerContact;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('buyerToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Prepare the data for the API
      const orderData = {
        platform: form.platform,
        productLink: form.productLink,
        country: form.country,
        currency: form.currency,
        sellerContact: form.sellerContact,
        scopeBox: {
          title: form.scopeBox.title,
          productType: form.scopeBox.productType,
          productLink: form.scopeBox.productLink,
          description: form.scopeBox.description,
          attachments: filePreviews.map(f => f.name), // Just send file names for now
          condition: form.scopeBox.condition,
          deadline: form.scopeBox.deadline,
          price: form.scopeBox.price,
        }
      };

      const response = await axios.post('/api/orders', orderData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setOrderData(response.data.data);
        setFundingData(prev => ({ ...prev, amount: response.data.data.price }));
        setShowFundingModal(true);
      } else {
        setError(response.data.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      if (error.response?.status === 401) {
        navigate('/buyer/auth');
        return;
      }
      setError(error.response?.data?.message || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFundingSubmit = async (e) => {
    e.preventDefault();
    setFundingLoading(true);
    setError('');

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Fund the escrow
      const token = localStorage.getItem('buyerToken');
      const fundResponse = await axios.post(`/api/orders/${orderData.orderId}/fund-escrow`, {
        buyerId: buyerData.id,
        paymentMethod: 'credit_card',
        amount: fundingData.amount,
        cardDetails: {
          cardNumber: '4111111111111111', // Demo card number
          expiryMonth: '12',
          expiryYear: '2026',
          cvv: '123'
        }
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (fundResponse.data.success) {
        setShowFundingModal(false);
        setShowSuccess(true);
        
        // Redirect to order tracking page after 3 seconds
        setTimeout(() => {
          navigate(`/buyer/order/${orderData.orderId}`);
        }, 3000);
      } else {
        setError('Failed to fund escrow. Please try again.');
      }
    } catch (error) {
      console.error('Error funding escrow:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Payment failed. Please check your card details and try again.');
      }
    } finally {
      setFundingLoading(false);
    }
  };

  const handleFundingInput = (e) => {
    const { name, value } = e.target;
    setFundingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Show loading if buyer data is not loaded yet
  if (!buyerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80 font-inter text-lg">Loading buyer data...</p>
          <p className="text-white/60 font-inter text-sm mt-2">Debug: Component mounted but buyerData is null</p>
        </div>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">



      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center py-4 px-4 sm:py-8 sm:px-2">
        {/* Header */}
        <div className="w-full max-w-2xl mb-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => {
                console.log('Back to Dashboard clicked');
                window.location.href = '/buyer/dashboard';
              }}
              className="flex items-center text-cyan-400 hover:text-cyan-300 font-medium font-inter transition-all duration-300 hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent font-inter">Create New Order</h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
          
          {/* Welcome Message */}
          <div className="mt-4 p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg">
            <p className="text-sm text-white/90 font-inter">
              Welcome, <span className="font-semibold">{buyerData.firstName} {buyerData.lastName}</span>! 
              Create a new escrow order to protect your payment.
            </p>
          </div>
        </div>
      
              <div className="w-full max-w-2xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-4 sm:p-6 md:p-10 animate-fadeIn">
          {/* Stepper */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className={`flex-1 text-center text-xs sm:text-sm font-inter ${step >= 1 ? 'text-cyan-400 font-bold' : 'text-white/40'}`}>Order Details</div>
            <div className={`w-4 sm:w-8 h-1 mx-1 sm:mx-2 rounded ${step >= 1 ? 'bg-gradient-to-r from-cyan-400 to-emerald-400' : 'bg-white/20'}`} />
            <div className={`flex-1 text-center text-xs sm:text-sm font-inter ${step >= 2 ? 'text-cyan-400 font-bold' : 'text-white/40'}`}>Scope Box</div>
            <div className={`w-4 sm:w-8 h-1 mx-1 sm:mx-2 rounded ${step >= 2 ? 'bg-gradient-to-r from-cyan-400 to-emerald-400' : 'bg-white/20'}`} />
            <div className={`flex-1 text-center text-xs sm:text-sm font-inter ${step >= 3 ? 'text-cyan-400 font-bold' : 'text-white/40'}`}>Seller</div>
            <div className={`w-4 sm:w-8 h-1 mx-1 sm:mx-2 rounded ${step >= 3 ? 'bg-gradient-to-r from-cyan-400 to-emerald-400' : 'bg-white/20'}`} />
            <div className={`flex-1 text-center text-xs sm:text-sm font-inter ${step === 4 ? 'text-cyan-400 font-bold' : 'text-white/40'}`}>Confirm</div>
          </div>
        
                  {/* Step 1: Order Details */}
          {step === 1 && (
            <div className="space-y-4">
              <select name="platform" value={form.platform} onChange={handleInput} className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter" required>
                <option value="" className="text-gray-800 bg-gray-900">Select Platform</option>
                {platforms.map(p => <option key={p} className="text-gray-800 bg-gray-900">{p}</option>)}
              </select>
              <input name="productLink" value={form.productLink} onChange={handleInput} placeholder="Product Link" className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter" required />
              <select name="country" value={form.country} onChange={handleInput} className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter" required>
                <option value="" className="text-gray-800 bg-gray-900">Select Country</option>
                {countries.map(c => <option key={c} className="text-gray-800 bg-gray-900">{c}</option>)}
              </select>
              <select name="currency" value={form.currency} onChange={handleInput} className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter" required>
                <option value="" className="text-gray-800 bg-gray-900">Select Currency</option>
                {currencies.map(c => <option key={c} className="text-gray-800 bg-gray-900">{c}</option>)}
              </select>
              <div className="flex justify-end pt-4">
                <button 
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-lg font-inter" 
                  disabled={!validateStep1()} 
                  onClick={() => setStep(2)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        
        {/* Step 2: Scope Box */}
        {step === 2 && (
          <div className="space-y-4">
            <input 
              name="title" 
              value={form.scopeBox.title} 
              onChange={handleScopeInput} 
              placeholder="Project Title" 
              className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter" 
              required 
            />
            <select name="productType" value={form.scopeBox.productType} onChange={handleScopeInput} className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter" required>
                              <option value="" className="text-gray-800 bg-gray-900">Product Type</option>
                {productTypes.map(pt => <option key={pt} className="text-gray-800 bg-gray-900">{pt}</option>)}
            </select>
            <input name="productLink" value={form.scopeBox.productLink} onChange={handleScopeInput} placeholder="Product Link" className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter" required />
            <textarea name="description" value={form.scopeBox.description} onChange={handleScopeInput} placeholder="Description / Requirements" className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter min-h-[80px] resize-none" required />
            <div
              className="border-2 border-dashed border-white/30 rounded-xl p-6 text-center cursor-pointer bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input 
                type="file" 
                multiple 
                accept=".jpg,.jpeg,.png,.pdf,.mp4,.doc,.docx,.txt,.zip,.rar" 
                onChange={handleFileChange} 
                className="hidden" 
                id="file-upload" 
              />
              <div className="space-y-3">
                <div className="text-4xl mb-2">📁</div>
                <div className="text-lg font-semibold text-white font-inter">Upload Multiple Files</div>
                <div className="text-sm text-white/80 font-inter">
                  Click to browse or drag & drop multiple files here
                </div>
                <div className="text-xs text-white/60 font-inter">
                  Supported: Images, PDFs, Videos, Documents, Archives
                </div>
                <label htmlFor="file-upload" className="inline-block px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white rounded-lg transition-all duration-300 cursor-pointer font-inter font-medium hover:scale-105">
                  Choose Files
                </label>
              </div>
              
              {filePreviews.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="text-sm font-medium text-white font-inter mb-2">
                    Selected Files ({filePreviews.length}):
                  </div>
                  {filePreviews.length > 0 && (
                    <div className="mb-2">
                      <button
                        onClick={() => {
                          setFilePreviews([]);
                          setForm({ ...form, scopeBox: { ...form.scopeBox, attachments: [] } });
                        }}
                        className="text-xs text-red-400 hover:text-red-300 underline font-inter"
                      >
                        Clear All Files
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {filePreviews.map((f, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <span className="text-cyan-400 flex-shrink-0">
                            {f.type.startsWith('image/') ? '🖼️' : 
                             f.type.includes('pdf') ? '📄' : 
                             f.type.includes('video') ? '🎥' : 
                             f.type.includes('document') ? '📝' : '📎'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs truncate font-medium text-white font-inter">{f.name}</div>
                            <div className="text-xs text-white/60 font-inter">{formatFileSize(f.size)}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const newFiles = filePreviews.filter((_, index) => index !== i);
                            setFilePreviews(newFiles);
                            setForm({ ...form, scopeBox: { ...form.scopeBox, attachments: newFiles } });
                          }}
                          className="text-red-400 hover:text-red-300 text-xs ml-2 flex-shrink-0 font-inter"
                          title="Remove file"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-white/60 font-inter">
                    You can add more files by clicking "Choose Files" again
                  </div>
                </div>
              )}
            </div>
            <select name="condition" value={form.scopeBox.condition} onChange={handleScopeInput} className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter" required>
                              <option value="" className="text-gray-800 bg-gray-900">Condition of Product</option>
                {conditions.map(c => <option key={c} className="text-gray-800 bg-gray-900">{c}</option>)}
            </select>
            
            {/* Deadline Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white font-inter flex items-center">
                <span className="mr-2">📅</span>
                Project Deadline
              </label>
              <input 
                name="deadline" 
                type="datetime-local" 
                value={form.scopeBox.deadline} 
                onChange={handleScopeInput} 
                className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white font-inter" 
                required 
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-white/60 font-inter">Select the deadline for project completion</p>
            </div>
            
            {/* Price Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white font-inter flex items-center">
                <span className="mr-2">💰</span>
                Project Price
              </label>
              <div className="relative">
                <input 
                  name="price" 
                  type="number" 
                  value={form.scopeBox.price} 
                  onChange={handleScopeInput} 
                  placeholder="0.00" 
                  className="w-full px-4 py-3 pr-12 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter" 
                  required 
                  min="0"
                  step="0.01"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-white/60 text-sm font-medium font-inter">{form.currency || 'USD'}</span>
                </div>
              </div>
              <p className="text-xs text-white/60 font-inter">Enter the total project cost</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button 
                className="px-6 py-3 border-2 border-white/20 text-white rounded-xl font-medium transition-all duration-300 hover:bg-white/10 font-inter w-full sm:w-auto" 
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button 
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-lg font-inter w-full sm:w-auto sm:min-w-[120px]" 
                disabled={!validateStep2()} 
                onClick={() => setStep(3)}
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* Step 3: Seller Contact */}
        {step === 3 && (
          <div className="space-y-4">
            <input 
              name="sellerContact" 
              value={form.sellerContact} 
              onChange={handleInput} 
              placeholder="Seller Email or Phone" 
              className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter" 
              required 
            />
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button 
                className="px-6 py-3 border-2 border-white/20 text-white rounded-xl font-medium transition-all duration-300 hover:bg-white/10 font-inter w-full sm:w-auto" 
                onClick={() => setStep(2)}
              >
                Back
              </button>
              <button 
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-lg font-inter w-full sm:w-auto sm:min-w-[120px]" 
                disabled={!validateStep3()} 
                onClick={() => setStep(4)}
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="space-y-6 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <div className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent font-inter">Review & Confirm</div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 text-left text-sm sm:text-base">
              <div className="text-white font-inter"><b>Buyer:</b> {buyerData.firstName} {buyerData.lastName}</div>
              <div className="text-white font-inter"><b>Platform:</b> {form.platform}</div>
              <div className="text-white font-inter"><b>Product Link:</b> {form.productLink}</div>
              <div className="text-white font-inter"><b>Country:</b> {form.country}</div>
              <div className="text-white font-inter"><b>Currency:</b> {form.currency}</div>
              
              {/* Project Summary */}
              <div className="mt-4 p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-cyan-400 font-inter">Project Summary</span>
                  <span className="text-2xl">📋</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center text-white font-inter">
                    <span className="mr-2">💰</span>
                    <span><b>Price:</b> {formatPrice(form.scopeBox.price, form.currency)}</span>
                  </div>
                  <div className="flex items-center text-white font-inter">
                    <span className="mr-2">📅</span>
                    <span><b>Deadline:</b> {formatDeadline(form.scopeBox.deadline)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-2 text-white font-inter"><b>Scope Box:</b></div>
              <div className="ml-4 text-white/90 font-inter">
                <div><b>Title:</b> {form.scopeBox.title}</div>
                <div><b>Type:</b> {form.scopeBox.productType}</div>
                <div><b>Link:</b> {form.scopeBox.productLink}</div>
                <div><b>Description:</b> {form.scopeBox.description}</div>
                <div><b>Condition:</b> {form.scopeBox.condition}</div>
                <div><b>Attachments:</b> {filePreviews.length > 0 ? filePreviews.map(f => `${f.name} (${formatFileSize(f.size)})`).join(', ') : 'None'}</div>
                <div><b>Deadline:</b> {formatDeadline(form.scopeBox.deadline)}</div>
                <div><b>Price:</b> {formatPrice(form.scopeBox.price, form.currency)}</div>
              </div>
              <div className="mt-2 text-white font-inter"><b>Seller Contact:</b> {form.sellerContact}</div>
            </div>
            <button 
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-lg font-inter w-full" 
              disabled={loading} 
              onClick={handleSubmit}
            >
              {loading ? 'Creating Order...' : 'Create Order & Proceed to Payment'}
            </button>
          </div>
        )}
        {error && <div className="text-red-400 text-sm mt-2 font-inter bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-lg p-3">{error}</div>}
      </div>
      
      {/* Funding Modal */}
      {showFundingModal && orderData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">💳</div>
              <h3 className="text-2xl font-bold text-white mb-4">Fund Escrow</h3>
              <p className="text-white/80">
                Complete payment to secure your order and send scope box to seller.
              </p>
            </div>
            
            <div className="bg-cyan-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-4 mb-6">
              <div className="text-sm text-white/90">
                <div><b>Order ID:</b> {orderData.orderId}</div>
                <div><b>Amount:</b> <span className="text-emerald-400 font-semibold">{orderData.price}</span></div>
                <div><b>Status:</b> <span className="text-cyan-400 font-semibold">Pending Payment</span></div>
              </div>
            </div>
            
            <form onSubmit={handleFundingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={fundingData.cardNumber}
                  onChange={handleFundingInput}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={fundingData.expiryDate}
                    onChange={handleFundingInput}
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    name="cvv"
                    value={fundingData.cvv}
                    onChange={handleFundingInput}
                    placeholder="123"
                    className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  name="cardholderName"
                  value={fundingData.cardholderName}
                  onChange={handleFundingInput}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter"
                  required
                />
              </div>
              
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowFundingModal(false)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fundingLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50"
                >
                  {fundingLoading ? 'Processing...' : `Pay ${orderData.price}`}
                </button>
              </div>
            </form>
            
            <div className="mt-6 p-4 bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 rounded-xl text-sm text-yellow-300">
              <p className="font-medium">🔒 Secure Payment</p>
              <p>Your payment is processed securely. Funds will be held in escrow until the project is completed.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Modal */}
      {showSuccess && orderData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl mb-6">✅</div>
              <h3 className="text-2xl font-bold text-white mb-4">Order Created & Funded!</h3>
              <p className="text-white/80 mb-6">
                Your escrow order has been created, funded, and the scope box has been sent to the seller.
              </p>
              
              <div className="bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-4 mb-6">
                <div className="text-sm text-white/90">
                  <div><b>Order ID:</b> {orderData.orderId}</div>
                  <div><b>Status:</b> <span className="text-emerald-400 font-semibold">ESCROW_FUNDED</span></div>
                  <div><b>Amount Paid:</b> {orderData.price}</div>
                  <div><b>Seller Notified:</b> ✅</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-white/70">
                  <b>Scope Box:</b> Sent to seller
                </div>
                <div className="text-sm text-white/70">
                  <b>Tracking Link:</b> {orderData.orderTrackingLink}
                </div>
              </div>
              
              <p className="text-sm text-white/60 mt-6">
                Redirecting to order tracking page...
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
} 