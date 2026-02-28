import React, { useState } from 'react';
import { createPortal } from 'react-dom';

const StickyNav = ({ activeNavItem, scrollToSection, navigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginMenuOpen, setIsLoginMenuOpen] = useState(false);

  const loginMenu = typeof document !== 'undefined' ? createPortal(
    <>
      {isLoginMenuOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsLoginMenuOpen(false);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white shadow-elevation overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-neutral-100">
              <h3 className="text-xl font-bold text-navy-900">Choose Login Type</h3>
              <p className="mt-1 text-sm text-neutral-500">Select how you want to access ScrowX.</p>
            </div>
            <div className="p-6 flex flex-col gap-3 bg-neutral-50">
              <button
                type="button"
                onClick={() => {
                  setIsLoginMenuOpen(false);
                  navigate('/buyer/auth');
                }}
                className="w-full px-4 py-3 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-200 text-navy-900 font-medium text-left transition-colors shadow-sm"
              >
                Buyer Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLoginMenuOpen(false);
                  navigate('/seller/auth');
                }}
                className="w-full px-4 py-3 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-200 text-navy-900 font-medium text-left transition-colors shadow-sm"
              >
                Seller Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLoginMenuOpen(false);
                  navigate('/admin/login');
                }}
                className="w-full px-4 py-3 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-200 text-navy-900 font-medium text-left transition-colors shadow-sm"
              >
                Admin Login
              </button>
              <button
                type="button"
                onClick={() => setIsLoginMenuOpen(false)}
                className="w-full px-4 py-3 mt-2 rounded-xl text-neutral-500 hover:text-navy-900 hover:bg-neutral-100 text-center transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  ) : null;

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 bg-white border-b border-neutral-200 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => scrollToSection('home')}
            >
              <img
                src="/Logo.png"
                alt="ScrowX"
                className="h-8 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {/* Navigation Links */}
              {[
                { id: 'home', label: 'Home' },
                { id: 'how-it-works', label: 'How It Works' },
                { id: 'tutorial', label: 'Tutorial' },
                { id: 'founder', label: 'Founder' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-sm font-medium transition-colors duration-200 ${activeNavItem === item.id
                      ? 'text-primary-600'
                      : 'text-neutral-600 hover:text-navy-900'
                    }`}
                >
                  {item.label}
                </button>
              ))}

              {/* Auth Links */}
              <div className="flex items-center pl-6 border-l border-neutral-200">
                <button
                  onClick={() => setIsLoginMenuOpen(true)}
                  className="btn btn-primary px-6 py-2 text-sm"
                >
                  Login
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 -mr-2 text-neutral-600 hover:text-navy-900 hover:bg-neutral-100 rounded-md transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-neutral-100 bg-white py-4 absolute inset-x-0 shadow-lg animate-fadeIn">
              <div className="flex flex-col px-4 space-y-2">
                {/* Navigation Links */}
                {[
                  { id: 'home', label: 'Home' },
                  { id: 'how-it-works', label: 'How It Works' },
                  { id: 'tutorial', label: 'Tutorial' },
                  { id: 'founder', label: 'Founder' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      scrollToSection(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`block px-4 py-3 rounded-lg text-left font-medium transition-colors ${activeNavItem === item.id
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-navy-900'
                      }`}
                  >
                    {item.label}
                  </button>
                ))}

                <div className="h-px bg-neutral-100 my-2"></div>

                {/* Auth Links */}
                <button
                  onClick={() => {
                    setIsLoginMenuOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full px-4 py-3 rounded-lg text-left font-medium text-navy-900 hover:bg-neutral-50 transition-colors"
                >
                  Login
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
      {loginMenu}
    </>
  );
};

export default StickyNav;
