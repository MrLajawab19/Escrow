import React from 'react';
import { motion } from 'framer-motion';
import { Scale, Clock, AlertCircle, FileImage, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

const DisputeComparison = () => {
  return (
    <section id="disputes" className="py-24 bg-navy-900 text-white overflow-hidden relative">
      {/* Subtle grid background for the dark section */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50 z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
          
          {/* Left Column: Typography */}
          <div className="lg:col-span-4 mb-16 lg:mb-0">
            <p className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Scale size={16} /> AI-Powered Dispute Resolution
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-white font-inter mb-6 leading-[1.1]">
              Disputes resolved with fairness and speed.
            </h2>
            <p className="text-lg text-neutral-400 mb-8 leading-relaxed">
              Our AI Arbitration Engine reviews evidence against the locked ScopeBox and transaction data to deliver a fair decision in minutes. Human escalation is always available if required.
            </p>
            
            <div className="space-y-6 mb-8">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} className="text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Evidence Analysis</h4>
                  <p className="text-sm text-neutral-400">AI evaluates all submitted evidence objectively.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center shrink-0">
                  <Clock size={20} className="text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Instant Resolution</h4>
                  <p className="text-sm text-neutral-400">Most disputes resolved within minutes, not weeks.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} className="text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Human Escalation</h4>
                  <p className="text-sm text-neutral-400">Expert human review available if required.</p>
                </div>
              </div>
            </div>
            
            <button className="px-6 py-3 border border-neutral-700 hover:border-neutral-500 hover:bg-navy-800 rounded-xl font-semibold transition-all inline-flex items-center gap-2 text-sm">
              Learn more about disputes <ArrowRight size={16} />
            </button>
          </div>

          {/* Right Column: Embedded UI */}
          <div className="lg:col-span-8">
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="bg-navy-950 rounded-2xl border border-navy-800 overflow-hidden shadow-2xl relative"
            >
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-navy-800 flex justify-between items-center bg-navy-900/50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">Dispute #DIS-33921</span>
                  <span className="px-2 py-0.5 rounded-full bg-warning-500/10 border border-warning-500/20 text-warning-400 text-xs font-semibold">
                    In Review
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-400 font-medium">
                  <span className="text-white font-bold">5m</span> Avg Resolution Time
                </div>
              </div>
              
              {/* Body */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Buyer Claim */}
                  <div className="bg-navy-900 rounded-xl p-5 border border-navy-800">
                    <h3 className="text-sm font-bold text-white mb-3">Buyer Claim</h3>
                    <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
                      "The delivered logo doesn't match the brand guidelines and color requirements."
                    </p>
                    
                    <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Evidence (3)</h4>
                    <div className="flex gap-2">
                      <div className="w-10 h-10 rounded border border-navy-700 bg-navy-800 flex items-center justify-center opacity-80 hover:opacity-100 cursor-pointer">
                        <FileImage size={16} className="text-neutral-500" />
                      </div>
                      <div className="w-10 h-10 rounded border border-navy-700 bg-navy-800 flex items-center justify-center opacity-80 hover:opacity-100 cursor-pointer">
                        <FileImage size={16} className="text-neutral-500" />
                      </div>
                      <div className="w-10 h-10 rounded border border-navy-700 bg-navy-800 flex items-center justify-center text-xs font-bold text-neutral-400 cursor-pointer hover:bg-navy-700 hover:text-white transition-colors">
                        +1
                      </div>
                    </div>
                  </div>

                  {/* ScopeBox Reference (The Truth) */}
                  <div className="bg-navy-900 rounded-xl p-5 border border-navy-800 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 bg-navy-950 text-[10px] font-bold text-cyan-400 uppercase tracking-widest border border-navy-800 rounded">
                      ScopeBox Reference
                    </div>
                    <div className="space-y-4 mt-2">
                      <div>
                        <h4 className="text-xs font-bold text-white mb-1">Color Scheme</h4>
                        <p className="text-[10px] text-neutral-400">Primary and secondary color palette as per guidelines.</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white mb-1">File Formats</h4>
                        <p className="text-[10px] text-neutral-400">AI, EPS, PDF, PNG, JPG</p>
                      </div>
                    </div>
                  </div>

                  {/* Seller Evidence */}
                  <div className="bg-navy-900 rounded-xl p-5 border border-navy-800">
                    <h3 className="text-sm font-bold text-white mb-3">Seller Evidence</h3>
                    <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
                      "Delivered files meet all agreed requirements in the ScopeBox."
                    </p>
                    
                    <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Evidence (4)</h4>
                    <div className="flex gap-2">
                      <div className="flex-1 h-10 rounded border border-navy-700 bg-navy-800 flex items-center px-2 gap-2 opacity-80 hover:opacity-100 cursor-pointer">
                        <AlertCircle size={14} className="text-neutral-500" />
                        <span className="text-[10px] text-neutral-400 truncate">final-deliverables.zip</span>
                      </div>
                    </div>
                  </div>
                  
                </div>
                
                {/* AI Recommendation Output */}
                <div className="mt-6 border-t border-navy-800 pt-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">AI Evaluation</h4>
                      <p className="text-sm text-neutral-300">Based on evidence and ScopeBox evaluation:</p>
                    </div>
                    
                    <div className="bg-success-900/20 border border-success-500/20 rounded-xl px-6 py-4 min-w-[240px]">
                      <div className="text-success-400 font-bold mb-1 flex items-center gap-2">
                        <CheckCircle2 size={16} /> In Favor of Seller
                      </div>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-black text-white">90%</span>
                        <span className="text-xs text-neutral-400 mb-1">Match with ScopeBox</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              
              {/* Animated scanning line effect overlay */}
              <div className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent top-0 animate-[scan_4s_ease-in-out_infinite] pointer-events-none"></div>
              
            </motion.div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default DisputeComparison;
