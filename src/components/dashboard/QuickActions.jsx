import React from 'react';

const QuickActions = () => {
  const features = [
    {
      icon: (
        <svg className="w-7 h-7 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Scopes Protected',
      description: 'Define clear deliverables and avoid disputes.',
      link: 'Learn more',
    },
    {
      icon: (
        <svg className="w-7 h-7 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
      title: 'Dispute Resolution',
      description: 'AI-assisted evidence based resolution.',
      link: 'How it works',
    },
    {
      icon: (
        <svg className="w-7 h-7 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: 'Secure Payments',
      description: 'Your money is safe until work is approved.',
      link: 'Know more',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
      {features.map((feature, index) => (
        <div
          key={index}
          className="bg-white border border-neutral-200 rounded-2xl p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group cursor-default"
        >
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300">
            {feature.icon}
          </div>
          <h4 className="text-sm font-semibold text-navy-900 mb-1">{feature.title}</h4>
          <p className="text-xs text-neutral-500 leading-relaxed mb-3">{feature.description}</p>
          <span className="text-xs font-semibold text-primary-500 flex items-center gap-1 group-hover:gap-2 transition-all duration-200">
            {feature.link}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </div>
      ))}
    </div>
  );
};

export default QuickActions;
