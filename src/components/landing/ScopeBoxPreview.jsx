import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle2, Clock, Paperclip, ChevronRight, Lock } from 'lucide-react';

const ScopeBoxPreview = () => {
  const [activeTab, setActiveTab] = useState('deliverables');

  const tabContent = {
    overview: (
      <div className="space-y-8">
        <div>
          <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Description</div>
          <p className="text-sm text-navy-900 leading-relaxed">
            Create a unique brand identity including logo, typography, color palette and brand guidelines. The deliverables must be provided in vector formats (AI, EPS) and standard web formats (PNG, JPG, SVG).
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Start Date</div>
            <div className="text-sm font-semibold text-navy-900">May 13, 2026</div>
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Delivery Date</div>
            <div className="text-sm font-semibold text-navy-900">May 27, 2026</div>
          </div>
        </div>
      </div>
    ),
    deliverables: (
      <div className="space-y-4">
        {[
          { title: "Primary Logo Design", desc: "3 initial concepts, up to 2 revisions." },
          { title: "Color Palette & Typography", desc: "Defined hex codes and font families." },
          { title: "Brand Guidelines PDF", desc: "Rules for using the logo and brand assets." },
          { title: "Source Files", desc: "AI, EPS, SVG, PNG, and JPG formats." }
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-neutral-100 bg-neutral-50/50 hover:border-primary-200 hover:bg-primary-50/20 transition-colors">
            <CheckCircle2 size={18} className="text-primary-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-navy-900 mb-1">{item.title}</h4>
              <p className="text-xs text-neutral-600">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
    criteria: (
      <div className="space-y-4">
        <p className="text-sm text-neutral-600 mb-4">The buyer will release funds based on the following acceptance criteria:</p>
        <ul className="space-y-3">
          {[
            "Logo must scale well to small sizes (app icons).",
            "Colors must pass WCAG AA accessibility contrast.",
            "Files must be layered correctly in Adobe Illustrator.",
            "Brand guide must be at least 5 pages."
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-navy-900">
              <span className="w-5 h-5 rounded-full bg-success-50 text-success-600 flex items-center justify-center shrink-0 text-xs font-bold">{i+1}</span>
              <span className="mt-0.5">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
    timeline: (
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent">
        {[
          { date: "May 13", title: "Project Kickoff", status: "Done" },
          { date: "May 20", title: "Initial Concepts", status: "Pending" },
          { date: "May 27", title: "Final Delivery", status: "Pending" }
        ].map((item, i) => (
          <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-primary-100 text-primary-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-600"></div>
            </div>
            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-neutral-100 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold text-navy-900">{item.title}</h4>
                <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">{item.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
    attachments: (
      <div className="grid grid-cols-2 gap-4">
        {[
          { name: "creative-brief.pdf", size: "2.4 MB" },
          { name: "moodboard-v1.jpg", size: "1.1 MB" },
          { name: "competitor-analysis.pdf", size: "3.8 MB" }
        ].map((file, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-primary-300 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
              <Paperclip size={18} />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-navy-900 truncate">{file.name}</div>
              <div className="text-[10px] text-neutral-500">{file.size}</div>
            </div>
          </div>
        ))}
      </div>
    )
  };

  const getTabTitle = (id) => {
    const map = {
      overview: 'Project Overview',
      deliverables: 'Deliverables',
      criteria: 'Acceptance Criteria',
      timeline: 'Timeline & Milestones',
      attachments: 'Attachments'
    };
    return map[id];
  };

  return (
    <section id="scopebox" className="py-24 bg-neutral-50 border-t border-neutral-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
          
          {/* Left Column: Typography */}
          <div className="lg:col-span-4 mb-16 lg:mb-0">
            <p className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-4">ScopeBox</p>
            <h2 className="text-4xl md:text-5xl font-black text-navy-900 font-inter mb-6 leading-[1.1]">
              Lock the scope.<br/>Prevent disputes.
            </h2>
            <p className="text-lg text-neutral-600 mb-8 leading-relaxed">
              Define clear deliverables, acceptance criteria, and timelines so everyone is aligned before work begins.
            </p>
            
            <button className="text-primary-600 font-semibold inline-flex items-center gap-2 hover:text-primary-700 transition-colors group">
              Learn more about ScopeBox
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Right Column: Embedded UI */}
          <div className="lg:col-span-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="bg-white rounded-3xl shadow-elevated border border-neutral-200 overflow-hidden flex flex-col md:flex-row min-h-[480px]"
            >
              
              {/* Sidebar Menu */}
              <div className="w-full md:w-64 bg-neutral-50/50 border-r border-neutral-100 p-6 flex flex-col shrink-0">
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-navy-900 leading-tight">ScopeBox</div>
                    <div className="text-[10px] text-neutral-500 font-medium">For Brand Identity Design</div>
                  </div>
                </div>

                <nav className="space-y-1">
                  {[
                    { id: 'overview', label: 'Project Overview', icon: FileText, count: null },
                    { id: 'deliverables', label: 'Deliverables', icon: CheckCircle2, count: 4 },
                    { id: 'criteria', label: 'Acceptance Criteria', icon: CheckCircle2, count: 6 },
                    { id: 'timeline', label: 'Timeline & Milestones', icon: Clock, count: 2 },
                    { id: 'attachments', label: 'Attachments', icon: Paperclip, count: 3 },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                        ${activeTab === item.id 
                          ? 'bg-white shadow-sm border border-neutral-200 text-navy-900' 
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-navy-900'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon size={16} className={activeTab === item.id ? 'text-primary-600' : 'text-neutral-400'} />
                        {item.label}
                      </div>
                      {item.count && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
                          ${activeTab === item.id ? 'bg-primary-50 text-primary-600' : 'bg-neutral-200 text-neutral-500'}
                        `}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-6 md:p-8 bg-white flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-navy-900">{getTabTitle(activeTab)}</h3>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-50 border border-success-100 text-success-700 text-xs font-bold">
                    <Lock size={12} className="stroke-[3]" />
                    Locked
                  </span>
                </div>

                <div className="flex-1 relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 overflow-y-auto pr-2"
                    >
                      {tabContent[activeTab]}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="mt-8 pt-6 border-t border-neutral-100">
                  <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">Parties & Agreement Status</div>
                  <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
                    
                    {/* Buyer Status */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center font-bold text-sm">
                        AS
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Buyer</div>
                        <div className="text-sm font-bold text-navy-900 flex items-center gap-1">
                          Arjun Sharma <CheckCircle2 size={14} className="text-success-500" />
                        </div>
                      </div>
                    </div>

                    {/* Seller Status */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
                        SN
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Seller</div>
                        <div className="text-sm font-bold text-navy-900 flex items-center gap-1">
                          Studio North <CheckCircle2 size={14} className="text-success-500" />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </motion.div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default ScopeBoxPreview;
