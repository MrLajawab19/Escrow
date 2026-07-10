import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Shield, FileText, CheckCircle2, Lock, ArrowRight, Download, UploadCloud, ShieldCheck } from 'lucide-react';

// Import fixed
const ProductDemo = ({ phase }) => {
  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-navy-900 rounded-2xl shadow-elevated border border-neutral-100 dark:border-white/10 overflow-hidden relative">
      {/* Header */}
      <div className="px-5 py-3 border-b border-neutral-100 dark:border-white/10 flex justify-between items-center bg-neutral-50/80 dark:bg-white/5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-navy-900 dark:text-white">Transaction #TXN-78291</span>
          <span className={`px-2 py-0.5 rounded-full border text-xs font-semibold transition-colors duration-500
            ${phase === 3 ? 'bg-success-50 dark:bg-success-900/30 border-success-200 dark:border-success-800 text-success-700 dark:text-success-400' : 
              phase === 2 ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' : 
              'bg-neutral-100 dark:bg-navy-800 border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400'}`}
          >
            {phase === 1 ? 'Drafting' : phase === 2 ? 'Funds Secured' : 'Completed'}
          </span>
        </div>
      </div>
      
      {/* Body */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          {/* Buyer */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-300 flex items-center justify-center font-bold text-sm">AS</div>
            <div>
              <div className="text-sm font-bold text-navy-900 dark:text-white">Arjun Sharma</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Buyer</div>
            </div>
          </div>
          
          {/* Divider */}
          <div className="flex-1 px-8 flex items-center justify-center">
            <div className="h-px bg-neutral-200 dark:bg-white/10 w-full relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-white/20"></div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-white/20"></div>
              
              <div className={`absolute top-1/2 -translate-y-1/2 h-0.5 bg-primary-500 transition-all duration-700 ease-in-out
                ${phase === 1 ? 'w-0' : phase === 2 ? 'w-1/2' : 'w-full'}`}>
              </div>
              
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-navy-900 px-2 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                {phase === 1 ? 'NEGOTIATING' : phase === 2 ? 'LOCKED' : 'DELIVERED'}
              </div>
            </div>
          </div>
          
          {/* Seller */}
          <div className="flex items-center gap-3 text-right">
            <div>
              <div className="text-sm font-bold text-navy-900 dark:text-white">Studio North</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Seller</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-navy-900 flex items-center justify-center font-bold text-sm">SN</div>
          </div>
        </div>
        
        {/* Project Details */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white">Brand Identity Design</h3>
            <div className="text-right">
              <div className="text-xl font-bold text-navy-900 dark:text-white tabular-nums">₹25,000</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Transaction Value</div>
            </div>
          </div>
        </div>

        {/* Dynamic Phase Content Container */}
        <div className="relative h-[260px]">
          <AnimatePresence mode="wait">
            
            {/* PHASE 1: AGREE */}
            {phase === 1 && (
              <motion.div 
                key="phase1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col justify-center items-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-500 dark:text-primary-400 mb-4">
                  <FileText size={28} />
                </div>
                <h4 className="text-lg font-bold text-navy-900 dark:text-white mb-2">ScopeBox Created</h4>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">4 Deliverables • 2 Weeks Timeline</p>
                
                <div className="w-full max-w-sm space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-navy-800 border border-neutral-100 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-navy-100 dark:bg-navy-700 text-navy-700 dark:text-navy-300 flex items-center justify-center text-[10px] font-bold">AS</div>
                      <span className="text-sm font-medium text-navy-900 dark:text-white">Buyer Accepted</span>
                    </div>
                    <CheckCircle2 size={16} className="text-success-500" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-navy-800 border border-neutral-100 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-navy-900 flex items-center justify-center text-[10px] font-bold">SN</div>
                      <span className="text-sm font-medium text-navy-900 dark:text-white">Seller Accepted</span>
                    </div>
                    <CheckCircle2 size={16} className="text-success-500" />
                  </div>
                </div>
                
                <div className="mt-4 w-full max-w-sm py-2.5 bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 uppercase tracking-wide">
                  <Lock size={14} /> Scope Locked
                </div>
              </motion.div>
            )}

            {/* PHASE 2: PROTECT */}
            {phase === 2 && (
              <motion.div 
                key="phase2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col justify-center items-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-success-50 dark:bg-success-900/30 flex items-center justify-center text-success-500 dark:text-success-400 mb-4">
                  <ShieldCheck size={28} />
                </div>
                <h4 className="text-2xl font-black text-navy-900 dark:text-white mb-2">₹25,000 Secured</h4>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">Funds held by regulated payment processor</p>
                
                <div className="w-full max-w-sm p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 flex gap-4 text-left">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-blue-900/50 flex items-center justify-center text-blue-500 dark:text-blue-400 shadow-sm shrink-0">
                    <div className="w-4 h-4 rounded-full border-2 border-blue-500 dark:border-blue-400 border-t-transparent animate-spin"></div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-navy-900 dark:text-white">Work in Progress</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Seller is working on deliverables...</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PHASE 3: COMPLETE */}
            {phase === 3 && (
              <motion.div 
                key="phase3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col justify-center items-center text-center"
              >
                <div className="w-full max-w-sm bg-neutral-50 dark:bg-navy-800 rounded-xl border border-neutral-100 dark:border-white/10 p-4 mb-4 text-left">
                  <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3">Delivery Submitted</div>
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-navy-900 rounded-lg border border-neutral-200 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-neutral-400 dark:text-neutral-500" />
                      <span className="text-sm font-medium text-navy-900 dark:text-white">brand-assets-final.zip</span>
                    </div>
                    <Download size={16} className="text-primary-500" />
                  </div>
                </div>
                
                <div className="w-full max-w-sm bg-success-500 text-white rounded-xl py-3.5 font-bold text-sm shadow-md flex items-center justify-center gap-2 mb-4">
                  <CheckCircle2 size={18} />
                  Approve & Release Payment
                </div>
                
                <div className="text-xs font-bold text-success-600 dark:text-success-400 uppercase tracking-widest flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-success-100 dark:bg-success-900/40 flex items-center justify-center"><CheckCircle2 size={10} /></div>
                  Funds Released
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const InteractiveTimeline = () => {
  const [activePhase, setActivePhase] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  
  useEffect(() => {
    // Autoplay when in view and not hovered. Cycles through phases continuously.
    if (!isInView || isHovered) return;
    
    const interval = setInterval(() => {
      setActivePhase(prev => prev === 3 ? 1 : prev + 1);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [isInView, isHovered]);

  const phases = [
    {
      id: 1,
      eyebrow: '01 — AGREE',
      title: 'Agree on the work',
      desc: 'Lock the scope, deliverables, timeline, and expectations before work begins.',
    },
    {
      id: 2,
      eyebrow: '02 — PROTECT',
      title: 'Work with confidence',
      desc: 'Funds stay secured while the seller completes the agreed work.',
    },
    {
      id: 3,
      eyebrow: '03 — COMPLETE',
      title: 'Review and complete',
      desc: 'Review the delivery. Once approved, the transaction is completed and payment is released.',
    }
  ];

  return (
    <section ref={sectionRef} id="how-it-works" className="py-8 lg:py-12 bg-neutral-50/50 dark:bg-navy-950 border-b border-neutral-100 dark:border-white/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-[0.2em] mb-4">How It Works</p>
          <h2 className="text-4xl lg:text-5xl font-black text-navy-900 dark:text-white font-inter mb-6 tracking-tight">
            Three moments. One secure deal.
          </h2>
          <p className="text-xl text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            From agreement to payment, every step stays clear, documented, and protected.
          </p>
        </div>

        {/* Side-by-Side Layout */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
          
          {/* Left Column: Vertical Tabs */}
          <div 
            className="lg:col-span-5 flex flex-col gap-3 mb-10 lg:mb-0"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {phases.map((p) => (
              <button
                key={p.id}
                onMouseEnter={() => setActivePhase(p.id)}
                onClick={() => setActivePhase(p.id)}
                className={`text-left p-5 lg:p-6 rounded-2xl transition-all duration-300 outline-none w-full relative overflow-hidden ${
                  activePhase === p.id 
                    ? 'bg-white dark:bg-navy-900 shadow-elevated border-2 border-primary-500 dark:border-primary-500 z-10' 
                    : 'bg-transparent border-2 border-transparent hover:bg-white dark:hover:bg-navy-800 hover:border-neutral-200 dark:hover:border-white/10 hover:shadow-sm'
                }`}
              >
                {/* Progress bar indicator for active phase */}
                {activePhase === p.id && !isHovered && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2.5, ease: "linear" }}
                    className="absolute top-0 left-0 h-1 bg-primary-100 dark:bg-primary-900/50"
                  />
                )}
                
                <div className={`text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5 transition-colors duration-300 ${activePhase === p.id ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-400 dark:text-neutral-500'}`}>
                  {p.eyebrow}
                </div>
                <h3 className={`text-lg lg:text-xl font-bold mb-1.5 transition-colors duration-300 ${activePhase === p.id ? 'text-navy-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-400'}`}>
                  {p.title}
                </h3>
                <p className={`text-xs leading-relaxed transition-colors duration-300 ${activePhase === p.id ? 'text-neutral-600 dark:text-neutral-300' : 'text-neutral-500 dark:text-neutral-500'}`}>
                  {p.desc}
                </p>
              </button>
            ))}
          </div>

          {/* Right Column: Centralized Product Demo */}
          <div className="lg:col-span-7 flex justify-center lg:justify-end">
            <div className="w-full max-w-md lg:ml-auto">
              <ProductDemo phase={activePhase} />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default InteractiveTimeline;
