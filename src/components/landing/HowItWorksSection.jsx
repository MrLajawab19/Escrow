import React from 'react';

const HowItWorksSection = () => {
  const steps = [
    {
      step: '01',
      title: 'Create Order',
      description: 'Buyer creates an order with detailed requirements',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    {
      step: '02',
      title: 'Fund Escrow',
      description: 'Payment is held securely in escrow',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      step: '03',
      title: 'Work & Deliver',
      description: 'Seller completes work and submits delivery',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      step: '04',
      title: 'Release Funds',
      description: 'Buyer approves and funds are released',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connection Lines for Desktop */}
          <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-[2px] bg-neutral-200"></div>

          {steps.map((item, index) => (
            <div
              key={index}
              className="relative text-center"
            >
              {/* Step Icon */}
              <div className="w-24 h-24 rounded-2xl bg-primary-500 flex items-center justify-center mx-auto mb-6 shadow-md relative z-10 transition-transform duration-300 hover:-translate-y-1">
                {item.icon}
              </div>

              {/* Step Info */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 mt-2">
                <div className="text-primary-500 text-sm font-bold tracking-wider mb-2 uppercase">
                  Step {item.step}
                </div>
                <h4 className="font-bold text-navy-900 text-xl mb-3">{item.title}</h4>
                <p className="text-neutral-500 text-sm leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
