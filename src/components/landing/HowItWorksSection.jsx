import React from 'react';

const HowItWorksSection = () => {
  const steps = [
    {
      step: '01',
      title: 'Create Order',
      description: 'Buyer creates an order with detailed requirements and deliverables',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    {
      step: '02',
      title: 'Fund Escrow',
      description: 'Buyer deposits payment securely into escrow — funds are protected',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      step: '03',
      title: 'Work & Deliver',
      description: 'Seller completes the work and submits delivery for review',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      step: '04',
      title: 'Approve or Dispute',
      description: 'Buyer approves the delivery or raises a dispute for resolution',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      step: '05',
      title: 'Release Funds',
      description: 'Funds are released transparently to the seller after approval',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-navy-900 mb-4">
            How It Works
          </h2>
          <p className="text-neutral-500 text-lg max-w-2xl mx-auto">
            A simple, secure, and transparent process for every transaction.
          </p>
        </div>

        {/* 5-column grid — uses 3 cols on md, 5 on lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 relative">
          {/* Connection line – visible on lg only */}
          <div className="hidden lg:block absolute top-11 left-[8%] right-[8%] h-[2px] bg-neutral-200 z-0" />

          {steps.map((item, index) => (
            <div key={index} className="relative text-center flex flex-col items-center">
              {/* Step Icon */}
              <div className="w-20 h-20 rounded-2xl bg-primary-500 flex items-center justify-center shadow-md relative z-10 transition-transform duration-300 hover:-translate-y-1 flex-shrink-0">
                {item.icon}
              </div>

              {/* Step Info Card — equal height via flex column + grow */}
              <div className="w-full bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 mt-4 flex flex-col flex-1" style={{ minHeight: '140px' }}>
                <div className="text-primary-500 text-xs font-bold tracking-wider mb-2 uppercase">
                  Step {item.step}
                </div>
                <h4 className="font-bold text-navy-900 text-base mb-2 leading-snug">{item.title}</h4>
                <p className="text-neutral-500 text-xs leading-relaxed flex-1">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
