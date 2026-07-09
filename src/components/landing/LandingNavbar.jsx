import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronRight } from 'lucide-react';

const LandingNavbar = ({ onAuthClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'ScopeBox', href: '#scopebox' },
    { name: 'Disputes', href: '#disputes' },
  ];

  return (
    <nav
      className={`absolute top-0 inset-x-0 z-50 transition-all duration-300 border-b ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-neutral-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] py-3'
          : 'bg-transparent border-neutral-200/50 py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0 cursor-pointer flex items-center mr-8" onClick={() => window.scrollTo(0, 0)}>
            <img src="/Logo.png" alt="ScrowX" className="h-10 sm:h-12 w-auto object-contain" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 flex-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-[15px] font-semibold text-navy-900 hover:bg-neutral-100/80 px-4 py-2 rounded-full transition-all tracking-tight"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.querySelector(link.href);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={onAuthClick}
              className="text-[15px] font-semibold text-navy-900 hover:bg-neutral-100/80 px-4 py-2 rounded-full transition-all tracking-tight"
            >
              Sign in
            </button>
            <button
              onClick={onAuthClick}
              className="px-4 py-2 text-[15px] font-semibold rounded-full text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-[0_2px_10px_-3px_rgba(99,91,255,0.4)] hover:shadow-[0_4px_14px_-2px_rgba(99,91,255,0.5)] flex items-center gap-1.5 tracking-tight ml-2"
            >
              Get started <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-4">
             <button
              onClick={onAuthClick}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              Get started
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-neutral-600 hover:text-navy-900 focus:outline-none p-1"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-neutral-200 shadow-lg py-4 px-4 flex flex-col space-y-4">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-base font-medium text-neutral-600 hover:text-navy-900 px-2 py-1"
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                const el = document.querySelector(link.href);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              {link.name}
            </a>
          ))}
          <div className="pt-4 border-t border-neutral-100 flex flex-col space-y-3">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onAuthClick();
              }}
              className="w-full text-center py-2 text-base font-medium text-neutral-600 hover:text-navy-900"
            >
              Log in
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onAuthClick();
              }}
              className="w-full text-center py-2 px-4 text-base font-medium rounded-xl text-white bg-navy-900 hover:bg-navy-800"
            >
              Get started
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default LandingNavbar;
