import React, { useState } from 'react';

const productTypes = [
  'Logo Design', 'Website', 'App', 'Document', 'Video', 'Other'
];
const conditions = ['New', 'Used', 'Refurbished', 'Other'];

export default function ScopeBoxModal({ open, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(initialData || {
    productType: '',
    productLink: '',
    description: '',
    attachments: [],
    condition: '',
  });
  const [filePreviews, setFilePreviews] = useState([]);
  const [error, setError] = useState('');

  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setForm({ ...form, attachments: files });
    setFilePreviews(files.map(f => ({ name: f.name, type: f.type })));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.productType || !form.productLink || !form.description || !form.condition) {
      setError('Please fill all required fields.');
      return;
    }
    setError('');
    onSubmit(form);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative animate-fadeIn">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={onClose}>&times;</button>
        <h3 className="text-lg font-bold mb-4">Scope Box</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <select name="productType" value={form.productType} onChange={handleInput} className="input w-full" required>
            <option value="">Product Type</option>
            {productTypes.map(pt => <option key={pt}>{pt}</option>)}
          </select>
          <input name="productLink" value={form.productLink} onChange={handleInput} placeholder="Product Link" className="input w-full" required />
          <textarea name="description" value={form.description} onChange={handleInput} placeholder="Description / Requirements" className="input w-full min-h-[80px]" required />
          <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.mp4,.doc,.docx,.txt" onChange={handleFileChange} className="input w-full" />
          {filePreviews.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {filePreviews.map((f, i) => (
                <span key={i} className="bg-gray-100 px-2 py-1 rounded text-xs">{f.name}</span>
              ))}
            </div>
          )}
          <select name="condition" value={form.condition} onChange={handleInput} className="input w-full" required>
            <option value="">Condition of Product</option>
            {conditions.map(c => <option key={c}>{c}</option>)}
          </select>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
}
// .input, .btn, .btn-outline, .btn-primary classes as described in NewOrderModal.jsx 