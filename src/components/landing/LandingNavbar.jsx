import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronRight, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const LandingNavbar = ({ onAuthClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
          ? 'bg-white/95 dark:bg-navy-950/95 backdrop-blur-md border-neutral-200 dark:border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.02)] py-3'
          : 'bg-transparent border-neutral-200/50 dark:border-white/10 py-5'
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
                className="text-[15px] font-semibold text-navy-900 dark:text-white hover:bg-neutral-100/80 dark:hover:bg-white/10 px-4 py-2 rounded-full transition-all tracking-tight focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-navy-900 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={onAuthClick}
              className="text-[15px] font-semibold text-navy-900 dark:text-white hover:bg-neutral-100/80 dark:hover:bg-white/10 px-4 py-2 rounded-full transition-all tracking-tight focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Sign in
            </button>
            <button
              onClick={onAuthClick}
              className="px-4 py-2 text-[15px] font-semibold rounded-full text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-[0_2px_10px_-3px_rgba(99,91,255,0.4)] hover:shadow-[0_4px_14px_-2px_rgba(99,91,255,0.5)] flex items-center gap-1.5 tracking-tight ml-2"
            >
              Start a transaction <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-4">
             <button
              onClick={onAuthClick}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              Start a transaction
            </button>
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
              className="p-1 text-neutral-600 dark:text-neutral-400 hover:text-navy-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            >
              {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-neutral-600 dark:text-neutral-400 hover:text-navy-900 dark:hover:text-white focus:outline-none p-1 focus:ring-2 focus:ring-primary-500 rounded"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-navy-950 border-b border-neutral-200 dark:border-white/10 shadow-lg py-4 px-4 flex flex-col space-y-4">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-base font-medium text-neutral-600 dark:text-neutral-300 hover:text-navy-900 dark:hover:text-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
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
          <div className="pt-4 border-t border-neutral-100 dark:border-white/10 flex flex-col space-y-3">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onAuthClick();
              }}
              className="w-full text-center py-2 text-base font-medium text-neutral-600 dark:text-neutral-300 hover:text-navy-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
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
              Start a transaction
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default LandingNavbar;
