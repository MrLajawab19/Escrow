import React, { useState } from 'react';
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
  const [form, setForm] = useState({
    buyerName: '',
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
  const [orderLink, setOrderLink] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState('');

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

  const validateStep1 = () => form.buyerName && form.platform && form.productLink && form.country && form.currency;
  const validateStep2 = () => form.scopeBox.productType && form.scopeBox.productLink && form.scopeBox.description && form.scopeBox.condition && form.scopeBox.deadline && form.scopeBox.price;
  const validateStep3 = () => form.sellerContact;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Prepare the data for the API
      const orderData = {
        buyerName: form.buyerName,
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

      const response = await axios.post('http://localhost:3000/api/orders', orderData);
      
      if (response.data.success) {
        setOrderLink(response.data.data.escrowLink);
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
          navigate('/buyer');
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setError(error.response?.data?.message || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex flex-col items-center py-4 px-4 sm:py-8 sm:px-2">
      {/* Header */}
      <div className="w-full max-w-2xl mb-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/buyer')}
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
            <input name="buyerName" value={form.buyerName} onChange={handleInput} placeholder="Buyer Name" className="input w-full" required />
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
            
            <div
              className="flex flex-col sm:flex-row gap-3 pt-4"
            >
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
              <div><b>Buyer:</b> {form.buyerName}</div>
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
              {loading ? 'Creating...' : 'Create Order & Send Link'}
            </button>
            {orderLink && (
              <div className="mt-4">
                <div className="font-semibold">Escrow Order Link:</div>
                <div className="bg-gray-100 rounded p-2 flex items-center justify-between">
                  <span className="truncate text-blue-600">{orderLink}</span>
                  <button className="btn btn-xs ml-2" onClick={() => navigator.clipboard.writeText(orderLink)}>Copy</button>
                </div>
              </div>
            )}
          </div>
        )}
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      </div>
      {showToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded shadow-lg animate-fadeIn">Order Created! Link sent to seller.</div>
      )}
    </div>
  );
} 