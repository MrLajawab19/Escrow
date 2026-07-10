import React from 'react';

const FinalCTA = ({ onAuthClick }) => {
  return (
    <section className="py-10 lg:py-16 bg-white dark:bg-navy-950 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-primary-50 dark:bg-primary-900/10 rounded-full blur-3xl opacity-50 z-0"></div>
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-cyan-50 dark:bg-cyan-900/10 rounded-full blur-3xl opacity-50 z-0"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          
          <div className="mb-12 lg:mb-0">
            <h2 className="text-4xl md:text-5xl font-black text-navy-900 dark:text-white font-inter mb-6 leading-[1.1]">
              Ready to make your<br/>next deal safer?
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 max-w-md">
              Whether you're hiring or doing the work, start with clear terms and a protected transaction.
            </p>
            <div className="flex items-center gap-4 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              <div className="w-10 h-10 rounded-full bg-success-50 dark:bg-success-900/30 flex items-center justify-center text-success-600 dark:text-success-400">
                ✓
              </div>
              <div>Free to join</div>
              <div className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-white/20"></div>
              <div>Only 2% fee on release</div>
            </div>
          </div>
          
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              
              <div className="bg-white dark:bg-navy-900 rounded-2xl border border-neutral-200 dark:border-white/10 p-8 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold text-navy-900 dark:text-white mb-2">I want to hire</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                  Define the work, secure the transaction, and hire with confidence.
                </p>
                <button 
                  onClick={onAuthClick}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-colors flex justify-center items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Start a Transaction
                </button>
              </div>

              <div className="bg-white dark:bg-navy-900 rounded-2xl border border-neutral-200 dark:border-white/10 p-8 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold text-navy-900 dark:text-white mb-2">I want to work</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                  Agree on the work upfront and get paid through a protected transaction.
                </p>
                <button 
                  onClick={onAuthClick}
                  className="w-full py-3 bg-white dark:bg-navy-800 border border-neutral-200 dark:border-white/20 hover:bg-neutral-50 dark:hover:bg-navy-700 text-navy-900 dark:text-white rounded-xl font-semibold transition-colors flex justify-center items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Join a Transaction
                </button>
              </div>

            </div>
            

          </div>
          
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
