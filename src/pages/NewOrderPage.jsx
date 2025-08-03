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
      setBuyerData(JSON.parse(data));
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
  const validateStep2 = () => form.scopeBox.productType && form.scopeBox.productLink && form.scopeBox.description && form.scopeBox.condition && form.scopeBox.deadline && form.scopeBox.price;
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex flex-col items-center py-4 px-4 sm:py-8 sm:px-2">
      {/* Header */}
      <div className="w-full max-w-2xl mb-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/buyer/dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-xl font-bold text-gray-900">Create New Order</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
        
        {/* Welcome Message */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            Welcome, <span className="font-semibold">{buyerData.firstName} {buyerData.lastName}</span>! 
            Create a new escrow order to protect your payment.
          </p>
        </div>
      </div>
      
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-10 animate-fadeIn">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className={`flex-1 text-center text-xs sm:text-sm ${step >= 1 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>Order Details</div>
          <div className="w-4 sm:w-8 h-1 bg-gray-200 mx-1 sm:mx-2 rounded" />
          <div className={`flex-1 text-center text-xs sm:text-sm ${step >= 2 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>Scope Box</div>
          <div className="w-4 sm:w-8 h-1 bg-gray-200 mx-1 sm:mx-2 rounded" />
          <div className={`flex-1 text-center text-xs sm:text-sm ${step >= 3 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>Seller</div>
          <div className="w-4 sm:w-8 h-1 bg-gray-200 mx-1 sm:mx-2 rounded" />
          <div className={`flex-1 text-center text-xs sm:text-sm ${step === 4 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>Confirm</div>
        </div>
        
        {/* Step 1: Order Details */}
        {step === 1 && (
          <div className="space-y-4">
            <select name="platform" value={form.platform} onChange={handleInput} className="input w-full" required>
              <option value="">Select Platform</option>
              {platforms.map(p => <option key={p}>{p}</option>)}
            </select>
            <input name="productLink" value={form.productLink} onChange={handleInput} placeholder="Product Link" className="input w-full" required />
            <select name="country" value={form.country} onChange={handleInput} className="input w-full" required>
              <option value="">Select Country</option>
              {countries.map(c => <option key={c}>{c}</option>)}
            </select>
            <select name="currency" value={form.currency} onChange={handleInput} className="input w-full" required>
              <option value="">Select Currency</option>
              {currencies.map(c => <option key={c}>{c}</option>)}
            </select>
            <div className="flex justify-end pt-4">
              <button 
                className="btn btn-primary w-full sm:w-auto sm:min-w-[120px]" 
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
            <select name="productType" value={form.scopeBox.productType} onChange={handleScopeInput} className="input w-full" required>
              <option value="">Product Type</option>
              {productTypes.map(pt => <option key={pt}>{pt}</option>)}
            </select>
            <input name="productLink" value={form.scopeBox.productLink} onChange={handleScopeInput} placeholder="Product Link" className="input w-full" required />
            <textarea name="description" value={form.scopeBox.description} onChange={handleScopeInput} placeholder="Description / Requirements" className="input w-full min-h-[80px]" required />
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer bg-gray-50 hover:bg-blue-50 transition-colors"
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
                <div className="text-lg font-semibold text-gray-700">Upload Multiple Files</div>
                <div className="text-sm text-gray-500">
                  Click to browse or drag & drop multiple files here
                </div>
                <div className="text-xs text-gray-400">
                  Supported: Images, PDFs, Videos, Documents, Archives
                </div>
                <label htmlFor="file-upload" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                  Choose Files
                </label>
              </div>
              
              {filePreviews.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Selected Files ({filePreviews.length}):
                  </div>
                  {filePreviews.length > 0 && (
                    <div className="mb-2">
                      <button
                        onClick={() => {
                          setFilePreviews([]);
                          setForm({ ...form, scopeBox: { ...form.scopeBox, attachments: [] } });
                        }}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                      >
                        Clear All Files
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {filePreviews.map((f, i) => (
                      <div key={i} className="flex items-center justify-between bg-white rounded px-3 py-2 border">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <span className="text-blue-600 flex-shrink-0">
                            {f.type.startsWith('image/') ? '🖼️' : 
                             f.type.includes('pdf') ? '📄' : 
                             f.type.includes('video') ? '🎥' : 
                             f.type.includes('document') ? '📝' : '📎'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs truncate font-medium">{f.name}</div>
                            <div className="text-xs text-gray-500">{formatFileSize(f.size)}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const newFiles = filePreviews.filter((_, index) => index !== i);
                            setFilePreviews(newFiles);
                            setForm({ ...form, scopeBox: { ...form.scopeBox, attachments: newFiles } });
                          }}
                          className="text-red-500 hover:text-red-700 text-xs ml-2 flex-shrink-0"
                          title="Remove file"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    You can add more files by clicking "Choose Files" again
                  </div>
                </div>
              )}
            </div>
            <select name="condition" value={form.scopeBox.condition} onChange={handleScopeInput} className="input w-full" required>
              <option value="">Condition of Product</option>
              {conditions.map(c => <option key={c}>{c}</option>)}
            </select>
            
            {/* Deadline Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <span className="mr-2">📅</span>
                Project Deadline
              </label>
              <input 
                name="deadline" 
                type="datetime-local" 
                value={form.scopeBox.deadline} 
                onChange={handleScopeInput} 
                className="input w-full" 
                required 
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-gray-500">Select the deadline for project completion</p>
            </div>
            
            {/* Price Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
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
                  className="input w-full pr-12" 
                  required 
                  min="0"
                  step="0.01"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-sm font-medium">{form.currency || 'USD'}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">Enter the total project cost</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button className="btn btn-outline w-full sm:w-auto" onClick={() => setStep(1)}>Back</button>
              <button 
                className="btn btn-primary w-full sm:w-auto sm:min-w-[120px]" 
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
            <input name="sellerContact" value={form.sellerContact} onChange={handleInput} placeholder="Seller Email or Phone" className="input w-full" required />
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button className="btn btn-outline w-full sm:w-auto" onClick={() => setStep(2)}>Back</button>
              <button 
                className="btn btn-primary w-full sm:w-auto sm:min-w-[120px]" 
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
            <div className="text-lg font-bold">Review & Confirm</div>
            <div className="bg-gray-50 rounded p-4 text-left text-sm sm:text-base">
              <div><b>Buyer:</b> {buyerData.firstName} {buyerData.lastName}</div>
              <div><b>Platform:</b> {form.platform}</div>
              <div><b>Product Link:</b> {form.productLink}</div>
              <div><b>Country:</b> {form.country}</div>
              <div><b>Currency:</b> {form.currency}</div>
              
              {/* Project Summary */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-blue-800">Project Summary</span>
                  <span className="text-2xl">📋</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <span className="mr-2">💰</span>
                    <span><b>Price:</b> {formatPrice(form.scopeBox.price, form.currency)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">📅</span>
                    <span><b>Deadline:</b> {formatDeadline(form.scopeBox.deadline)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-2"><b>Scope Box:</b></div>
              <div className="ml-4">
                <div><b>Type:</b> {form.scopeBox.productType}</div>
                <div><b>Link:</b> {form.scopeBox.productLink}</div>
                <div><b>Description:</b> {form.scopeBox.description}</div>
                <div><b>Condition:</b> {form.scopeBox.condition}</div>
                <div><b>Attachments:</b> {filePreviews.length > 0 ? filePreviews.map(f => `${f.name} (${formatFileSize(f.size)})`).join(', ') : 'None'}</div>
                <div><b>Deadline:</b> {formatDeadline(form.scopeBox.deadline)}</div>
                <div><b>Price:</b> {formatPrice(form.scopeBox.price, form.currency)}</div>
              </div>
              <div className="mt-2"><b>Seller Contact:</b> {form.sellerContact}</div>
            </div>
            <button 
              className="btn btn-primary w-full" 
              disabled={loading} 
              onClick={handleSubmit}
            >
              {loading ? 'Creating Order...' : 'Create Order & Proceed to Payment'}
            </button>
          </div>
        )}
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      </div>
      
      {/* Funding Modal */}
      {showFundingModal && orderData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">💳</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Fund Escrow</h3>
              <p className="text-gray-600">
                Complete payment to secure your order and send scope box to seller.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="text-sm">
                <div><b>Order ID:</b> {orderData.orderId}</div>
                <div><b>Amount:</b> <span className="text-green-600 font-semibold">{orderData.price}</span></div>
                <div><b>Status:</b> <span className="text-blue-600 font-semibold">Pending Payment</span></div>
              </div>
            </div>
            
            <form onSubmit={handleFundingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={fundingData.cardNumber}
                  onChange={handleFundingInput}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={fundingData.expiryDate}
                    onChange={handleFundingInput}
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    name="cvv"
                    value={fundingData.cvv}
                    onChange={handleFundingInput}
                    placeholder="123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  name="cardholderName"
                  value={fundingData.cardholderName}
                  onChange={handleFundingInput}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFundingModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fundingLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {fundingLoading ? 'Processing...' : `Pay ${orderData.price}`}
                </button>
              </div>
            </form>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
              <p className="font-medium">🔒 Secure Payment</p>
              <p>Your payment is processed securely. Funds will be held in escrow until the project is completed.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Modal */}
      {showSuccess && orderData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Order Created & Funded!</h3>
              <p className="text-gray-600 mb-4">
                Your escrow order has been created, funded, and the scope box has been sent to the seller.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="text-sm">
                  <div><b>Order ID:</b> {orderData.orderId}</div>
                  <div><b>Status:</b> <span className="text-green-600 font-semibold">ESCROW_FUNDED</span></div>
                  <div><b>Amount Paid:</b> {orderData.price}</div>
                  <div><b>Seller Notified:</b> ✅</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  <b>Scope Box:</b> Sent to seller
                </div>
                <div className="text-sm text-gray-600">
                  <b>Tracking Link:</b> {orderData.orderTrackingLink}
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mt-4">
                Redirecting to order tracking page...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 