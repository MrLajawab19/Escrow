import React from 'react';

const FinalCTA = ({ onAuthClick }) => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-primary-50 rounded-full blur-3xl opacity-50 z-0"></div>
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-cyan-50 rounded-full blur-3xl opacity-50 z-0"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          
          <div className="mb-12 lg:mb-0">
            <h2 className="text-4xl md:text-5xl font-black text-navy-900 font-inter mb-6 leading-[1.1]">
              Ready to start your<br/>secure transaction?
            </h2>
            <p className="text-lg text-neutral-600 mb-8 max-w-md">
              Join thousands of professionals and businesses who trust ScrowX to protect their deals.
            </p>
            <div className="flex items-center gap-4 text-sm font-semibold text-neutral-500">
              <div className="w-10 h-10 rounded-full bg-success-50 flex items-center justify-center text-success-600">
                ✓
              </div>
              <div>Free to join</div>
              <div className="w-1 h-1 rounded-full bg-neutral-300"></div>
              <div>Only 2% fee on release</div>
            </div>
          </div>
          
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              
              <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold text-navy-900 mb-2">I want to hire</h3>
                <p className="text-sm text-neutral-500 mb-6">
                  Start a secure transaction and work with confidence.
                </p>
                <button 
                  onClick={onAuthClick}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-colors flex justify-center items-center gap-2"
                >
                  Hire a Professional
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold text-navy-900 mb-2">I want to work</h3>
                <p className="text-sm text-neutral-500 mb-6">
                  Offer your services and get paid securely on time.
                </p>
                <button 
                  onClick={onAuthClick}
                  className="w-full py-3 bg-white border border-neutral-200 hover:bg-neutral-50 text-navy-900 rounded-xl font-semibold transition-colors flex justify-center items-center gap-2"
                >
                  Offer Services
                </button>
              </div>

            </div>
            
            {/* Stats using XX rule */}
            <div className="grid grid-cols-3 gap-6 pt-10 border-t border-neutral-100">
              <div>
                <div className="text-2xl font-black text-navy-900 mb-1">XX+</div>
                <div className="text-xs text-neutral-500 font-medium">Transactions Completed</div>
              </div>
              <div>
                <div className="text-2xl font-black text-navy-900 mb-1">₹XX+</div>
                <div className="text-xs text-neutral-500 font-medium">Secured in Escrow</div>
              </div>
              <div>
                <div className="text-2xl font-black text-navy-900 mb-1">XX%</div>
                <div className="text-xs text-neutral-500 font-medium">User Satisfaction</div>
              </div>
            </div>
            
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
