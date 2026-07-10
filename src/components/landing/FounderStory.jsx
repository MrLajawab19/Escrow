import React from 'react';
import { ArrowRight } from 'lucide-react';

const GithubIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

const LinkedinIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const InstagramIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FounderStory = () => {
  return (
    <section className="py-8 lg:py-12 bg-white dark:bg-navy-950 border-t border-neutral-100 dark:border-white/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          
          {/* Left Column: Image / Visual */}
          <div className="relative mb-12 lg:mb-0 flex justify-center lg:justify-end pr-0 lg:pr-8">
            <div className="relative w-64 md:w-80">
              {/* Background decorative blob */}
              <div className="absolute inset-0 bg-primary-50 dark:bg-primary-900/10 rounded-full blur-3xl opacity-60 translate-x-6 translate-y-6 z-0"></div>
              
              {/* Founder Image Container */}
              <div className="relative z-10 aspect-square md:aspect-[4/5] rounded-3xl overflow-hidden border-[6px] border-white dark:border-navy-900 shadow-xl bg-neutral-100 dark:bg-navy-800">
                <img 
                  src="/Profile.png" 
                  alt="Ayush Bardhani" 
                  className="w-full h-full object-cover object-[center_20%]"
                />
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -bottom-5 -right-5 md:-bottom-8 md:-left-8 lg:-left-12 bg-white dark:bg-navy-800 rounded-2xl p-4 shadow-lg border border-neutral-100 dark:border-white/10 z-20 animate-[slideUp_1s_ease-out] w-max">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-lg">
                    "
                  </div>
                  <div>
                    <div className="text-sm font-bold text-navy-900 dark:text-white">I built what I wish had existed.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Story Content */}
          <div>
            <p className="text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-4">The Founder's Story</p>
            <h2 className="text-4xl md:text-5xl font-black text-navy-900 dark:text-white font-inter mb-6 leading-[1.1]">
              Why I built ScrowX.
            </h2>
            
            <div className="space-y-6 text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed mb-10">
              <p>
                "In my second year of college, I was managing Instagram campaigns as a side income. For one project, I paid a manager ₹8,000 in advance. Soon after, he stopped responding.
              </p>
              <p>
                I spent months trying to recover the money through calls, messages, and eventually legal action. The problem wasn't just one bad deal. Informal online transactions gave neither side a clear way to protect themselves when something went wrong.
              </p>
              <p>
                I built ScrowX so people don't have to choose between trusting a stranger and walking away from a deal."
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-8 border-t border-neutral-100 dark:border-white/10 gap-6">
              <div>
                <h4 className="font-bold text-navy-900 dark:text-white text-lg">Ayush Bardhani</h4>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Founder & CEO, ScrowX</p>
              </div>
              
              <div className="flex items-center gap-4">
                <a 
                  href="https://www.linkedin.com/in/ayushbardhani-java-developer/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-navy-800 hover:bg-[#0077b5] dark:hover:bg-[#0077b5] hover:text-white dark:hover:text-white flex items-center justify-center text-neutral-600 dark:text-neutral-400 transition-colors shadow-sm"
                  aria-label="LinkedIn"
                >
                  <LinkedinIcon size={18} />
                </a>
                <a 
                  href="https://github.com/MrLajawab19" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-navy-800 hover:bg-[#333] dark:hover:bg-white hover:text-white dark:hover:text-[#333] flex items-center justify-center text-neutral-600 dark:text-neutral-400 transition-colors shadow-sm"
                  aria-label="GitHub"
                >
                  <GithubIcon size={18} />
                </a>
              </div>
            </div>
            
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default FounderStory;
