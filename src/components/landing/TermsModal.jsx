import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TermsModal = ({ show, onClose }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/20 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-white/10 px-8 py-6 flex items-center justify-between backdrop-blur-xl z-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  Terms & Conditions
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {/* Modal Content */}
              <div className="px-8 py-6 overflow-y-auto max-h-[calc(90vh-120px)] text-white/80 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-3">1. Introduction</h3>
                  <p className="leading-relaxed">
                    Welcome to ScrowX. By accessing and using our platform, you agree to be bound by these Terms and Conditions. 
                    ScrowX provides a secure escrow service for digital transactions, ensuring trust and safety for both buyers and sellers.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-3">2. Escrow Services</h3>
                  <p className="leading-relaxed mb-2">
                    ScrowX acts as a neutral third party to hold funds during transactions. Our services include:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Secure fund holding until transaction completion</li>
                    <li>AI-powered dispute resolution</li>
                    <li>Real-time order tracking and status updates</li>
                    <li>Evidence-based conflict management</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-3">3. User Responsibilities</h3>
                  <p className="leading-relaxed mb-2">Users agree to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Provide accurate and truthful information</li>
                    <li>Comply with all applicable laws and regulations</li>
                    <li>Maintain the confidentiality of account credentials</li>
                    <li>Use the platform in good faith and for lawful purposes</li>
                    <li>Submit genuine evidence in case of disputes</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-3">4. Payment Terms</h3>
                  <p className="leading-relaxed">
                    All payments are held in escrow until the buyer confirms satisfactory delivery. ScrowX charges a service fee 
                    based on the transaction value. Fees are transparently displayed before transaction confirmation. Funds are 
                    released to sellers within 24-48 hours of buyer approval.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-3">5. Dispute Resolution</h3>
                  <p className="leading-relaxed">
                    In case of disputes, our AI-powered system analyzes evidence from both parties to make fair determinations. 
                    Users can submit documents, screenshots, and other relevant materials. Final decisions are made within 5-7 business days. 
                    Both parties have the right to appeal decisions within 48 hours of the initial ruling.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-3">6. Privacy & Data Security</h3>
                  <p className="leading-relaxed">
                    We employ blockchain-level encryption to protect user data and transaction information. Personal information 
                    is never shared with third parties without explicit consent. All payment data is processed through secure, 
                    PCI-compliant gateways.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-3">7. Limitation of Liability</h3>
                  <p className="leading-relaxed">
                    ScrowX is not liable for delays or failures in service due to circumstances beyond our control. We are not 
                    responsible for the quality, safety, or legality of items exchanged. Our maximum liability is limited to the 
                    transaction value held in escrow.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-3">8. Prohibited Activities</h3>
                  <p className="leading-relaxed mb-2">Users are strictly prohibited from:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Engaging in fraudulent activities or money laundering</li>
                    <li>Trading illegal goods or services</li>
                    <li>Manipulating the dispute resolution process</li>
                    <li>Creating multiple accounts to circumvent restrictions</li>
                    <li>Attempting to bypass the escrow system</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-3">9. Account Termination</h3>
                  <p className="leading-relaxed">
                    ScrowX reserves the right to suspend or terminate accounts that violate these terms. Users may close their 
                    accounts at any time, provided all pending transactions are completed. Refunds for service fees are not provided 
                    for voluntary account closures.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-3">10. Changes to Terms</h3>
                  <p className="leading-relaxed">
                    We may update these Terms and Conditions periodically. Users will be notified of significant changes via email. 
                    Continued use of the platform after changes constitutes acceptance of the new terms.
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-white/60">
                    Last updated: January 15, 2025
                  </p>
                  <p className="text-sm text-white/60 mt-2">
                    For questions about these terms, please contact us at legal@scrowx.com
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gradient-to-r from-slate-800 to-slate-900 border-t border-white/10 px-8 py-6 backdrop-blur-xl">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
                >
                  I Understand
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TermsModal;
