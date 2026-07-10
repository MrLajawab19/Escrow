import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Briefcase, ArrowRight } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, navigate }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-navy-900/40 dark:bg-navy-950/80 backdrop-blur-sm"
          onClick={onClose}
        ></motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden"
        >
          <div className="p-6 border-b border-neutral-100 dark:border-white/10 flex justify-between items-center">
            <h3 className="text-xl font-bold text-navy-900 dark:text-white">Welcome to ScrowX</h3>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-navy-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-navy-700 hover:text-navy-900 dark:hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="p-6 space-y-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">How would you like to continue?</p>
            
            <button 
              onClick={() => {
                onClose();
                navigate('/buyer/auth');
              }}
              className="w-full p-4 rounded-xl border-2 border-neutral-100 dark:border-white/10 hover:border-primary-500 dark:hover:border-primary-500/50 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all flex items-center gap-4 group text-left"
            >
              <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                <Briefcase size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-navy-900 dark:text-white mb-1">I want to hire</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Fund a project and manage deliverables.</p>
              </div>
              <ArrowRight size={20} className="text-neutral-300 dark:text-neutral-600 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors" />
            </button>
            
            <button 
              onClick={() => {
                onClose();
                navigate('/seller/auth');
              }}
              className="w-full p-4 rounded-xl border-2 border-neutral-100 dark:border-white/10 hover:border-navy-900 dark:hover:border-white/20 hover:bg-neutral-50 dark:hover:bg-white/5 transition-all flex items-center gap-4 group text-left"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-navy-800 text-navy-900 dark:text-white flex items-center justify-center shrink-0">
                <User size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-navy-900 dark:text-white mb-1">I want to work</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Offer services and get paid securely.</p>
              </div>
              <ArrowRight size={20} className="text-neutral-300 dark:text-neutral-600 group-hover:text-navy-900 dark:group-hover:text-white transition-colors" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
