import React from 'react';

const TrustStrip = () => {
  return (
    <section className="py-12 bg-neutral-50 border-y border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-semibold text-neutral-500 mb-8 uppercase tracking-wider">
          Trusted by freelancers, agencies and businesses worldwide
        </p>
        
        {/* Logos Container */}
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale">
          {/* Note: Using placeholder text for logos since we don't have SVGs handy, 
              but styling them to look like a brand strip */}
          <div className="text-xl font-bold font-inter text-navy-900 tracking-tight">upwork</div>
          <div className="text-2xl font-black font-inter text-navy-900 tracking-tighter">fiverr.</div>
          <div className="text-xl font-bold font-inter text-navy-900 flex items-center gap-1">
            <span className="text-2xl">⚡</span> Toptal.
          </div>
          <div className="text-xl font-bold font-inter text-navy-900 italic">dribbble</div>
          <div className="text-xl font-bold font-inter text-navy-900 flex items-center gap-1">
            <span className="text-blue-500">✈</span> freelancer
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
