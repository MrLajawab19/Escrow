import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

const HeroEmbedded = ({ onAuthClick }) => {
  const [amount, setAmount] = useState(0);
  const targetAmount = 25000;
  
  useEffect(() => {
    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const stepTime = duration / steps;
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      // Easing function for smoother animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      if (currentStep >= steps) {
        setAmount(targetAmount);
        clearInterval(timer);
      } else {
        setAmount(Math.floor(targetAmount * easeOutQuart));
      }
    }, stepTime);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative pt-32 pb-20 lg:pt-32 lg:pb-20 overflow-hidden bg-white min-h-screen flex items-center border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
          
          {/* Left Column: Typography & CTA */}
          <motion.div 
            className="lg:col-span-5 mb-16 lg:mb-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-medium mb-6">
              <Shield size={16} />
              <span>Secure Trust Infrastructure</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black text-navy-900 tracking-tight leading-[1.1] mb-6 font-inter">
              Automating trust in every deal.
            </h1>
            
            <p className="text-lg text-neutral-600 mb-8 max-w-lg leading-relaxed">
              Most informal deals rely on a leap of faith and a risky advance. Trust shouldn't be a gamble. ScrowX replaces uncertain prepayments with a secure trust infrastructure.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onAuthClick}
                className="px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                Start a Transaction
              </button>
              <a 
                href="#how-it-works"
                className="px-6 py-3.5 bg-white border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-navy-900 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                How it Works
                <ArrowRight size={18} className="text-neutral-500" />
              </a>
            </div>
          </motion.div>
          
          {/* Right Column: Embedded UI Mockup */}
          <motion.div 
            className="lg:col-span-7 relative"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            {/* The UI Panel */}
            <div className="bg-white rounded-2xl shadow-elevated border border-neutral-200 overflow-hidden ml-auto max-w-[600px] relative">
              {/* Header */}
              <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-navy-900">Transaction #TXN-78291</span>
                  <span className="px-2 py-0.5 rounded-full bg-success-50 border border-success-200 text-success-700 text-xs font-semibold">
                    Funds Secured
                  </span>
                </div>
              </div>
              
              {/* Body */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  {/* Buyer */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center font-bold text-sm">
                      AS
                    </div>
                    <div>
                      <div className="text-sm font-bold text-navy-900">Arjun Sharma</div>
                      <div className="text-xs text-neutral-500">Buyer</div>
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="flex-1 px-4 flex items-center justify-center">
                    <div className="h-px bg-neutral-200 w-full relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-neutral-300"></div>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-neutral-300"></div>
                    </div>
                  </div>
                  
                  {/* Seller */}
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="text-sm font-bold text-navy-900">Studio North</div>
                      <div className="text-xs text-neutral-500">Seller</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
                      SN
                    </div>
                  </div>
                </div>
                
                {/* Project Details */}
                <div className="mb-8">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-navy-900">Brand Identity Design</h3>
                    <div className="text-right">
                      <div className="text-xl font-bold text-navy-900 tabular-nums">
                        ₹{amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-neutral-500">Transaction Value</div>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed max-w-sm">
                    Complete brand identity design for startup including logo, brand guidelines, and marketing assets.
                  </p>
                </div>
                
                {/* Timeline */}
                <div className="flex justify-between items-center mb-8 relative px-4">
                  <div className="absolute left-6 right-6 top-3 h-0.5 bg-neutral-100 -z-10"></div>
                  <div className="absolute left-6 w-[50%] top-3 h-0.5 bg-success-500 -z-10"></div>
                  
                  {[
                    { step: 'Agreement Created', active: true, done: true },
                    { step: 'ScopeBox Locked', active: true, done: true },
                    { step: 'Funds Secured', active: true, done: false, current: true },
                    { step: 'Work Delivered', active: false, done: false },
                    { step: 'Funds Released', active: false, done: false }
                  ].map((s, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 
                        ${s.done ? 'bg-success-500 border-success-500 text-white' : 
                          s.current ? 'bg-primary-600 border-primary-600 text-white shadow-[0_0_0_4px_rgba(99,91,255,0.15)]' : 
                          'bg-white border-neutral-200 text-neutral-400'}`}
                      >
                        {s.done ? <CheckCircle2 size={12} strokeWidth={3} /> : i + 1}
                      </div>
                      <span className={`text-[10px] font-semibold text-center leading-tight max-w-[60px] 
                        ${s.current ? 'text-primary-700' : s.done ? 'text-navy-900' : 'text-neutral-400'}`}>
                        {s.step}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Footer Data */}
                <div className="grid grid-cols-2 gap-4 bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Secured Value</div>
                    <div className="text-sm font-bold text-navy-900">₹25,000.00</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">Secured on May 12, 2026</div>
                  </div>
                  <div className="flex items-center gap-3 border-l border-neutral-200 pl-4">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                      <Lock size={14} />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500 mb-1">Locked Balance</div>
                      <div className="text-sm font-bold text-navy-900">₹25,000.00</div>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
            
            {/* Decorative background element behind UI */}
            <div className="absolute -inset-4 bg-gradient-to-br from-neutral-100 to-white opacity-50 blur-2xl -z-10 rounded-full mix-blend-multiply"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroEmbedded;
