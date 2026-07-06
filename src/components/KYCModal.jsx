import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function KYCModal({ isOpen, onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [idDocType, setIdDocType] = useState('AADHAR');
  const [fullLegalName, setFullLegalName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) return toast.error("Enter a valid 10-digit phone number");
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/kyc/send-otp`, { phone }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success("OTP sent!");
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) return toast.error("Enter a valid 6-digit OTP");
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/kyc/verify-otp`, { phone, otp }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success("Phone verified!");
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDocs = async () => {
    if (!fullLegalName || !dateOfBirth) return toast.error("Fill in all personal details");
    if (documents.length === 0) return toast.error("Please upload at least one ID document");

    const formData = new FormData();
    formData.append('idDocType', idDocType);
    formData.append('fullLegalName', fullLegalName);
    formData.append('dateOfBirth', dateOfBirth);
    Array.from(documents).forEach(file => {
      formData.append('documents', file);
    });

    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/kyc/submit-id`, formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success("KYC Documents submitted for review!");
      onComplete && onComplete();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit documents");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1b1e] border border-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
        <h2 className="text-2xl font-bold text-white mb-2">Complete KYC</h2>
        <p className="text-gray-400 mb-6 text-sm">Verify your identity to unlock high-value escrow transactions.</p>
        
        {/* Step Indicators */}
        <div className="flex gap-2 mb-8">
          <div className={`h-1 flex-1 rounded ${step >= 1 ? 'bg-indigo-500' : 'bg-gray-800'}`}></div>
          <div className={`h-1 flex-1 rounded ${step >= 2 ? 'bg-indigo-500' : 'bg-gray-800'}`}></div>
          <div className={`h-1 flex-1 rounded ${step >= 3 ? 'bg-indigo-500' : 'bg-gray-800'}`}></div>
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none transition-colors"
              />
            </div>
            <button 
              onClick={handleSendOtp} 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium p-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Enter 6-digit OTP</label>
              <input 
                type="text" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none transition-colors text-center text-2xl tracking-widest"
              />
            </div>
            <button 
              onClick={handleVerifyOtp} 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium p-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button onClick={() => setStep(1)} className="w-full text-gray-500 hover:text-white text-sm mt-2">
              Back to phone entry
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Full Legal Name</label>
              <input 
                type="text" 
                value={fullLegalName} 
                onChange={(e) => setFullLegalName(e.target.value)}
                placeholder="As per ID Document"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Date of Birth</label>
                <input 
                  type="date" 
                  value={dateOfBirth} 
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">ID Type</label>
                <select 
                  value={idDocType} 
                  onChange={(e) => setIdDocType(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none transition-colors"
                >
                  <option value="AADHAR">Aadhar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="PASSPORT">Passport</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Upload ID Images (Front & Back)</label>
              <input 
                type="file" 
                multiple
                accept="image/*,application/pdf"
                onChange={(e) => setDocuments(e.target.files)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none transition-colors text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
              />
            </div>
            <button 
              onClick={handleSubmitDocs} 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium p-3 rounded-lg transition-colors disabled:opacity-50 mt-4"
            >
              {loading ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
