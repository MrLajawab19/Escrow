import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const StickyNav = ({ activeNavItem, scrollToSection, navigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginMenuOpen, setIsLoginMenuOpen] = useState(false);

  const loginMenu = typeof document !== 'undefined' ? createPortal(
    <AnimatePresence>
      {isLoginMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsLoginMenuOpen(false);
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl"
          >
            <div className="px-6 pt-5 pb-4">
              <div className="text-lg font-semibold text-white">Choose login type</div>
              <div className="mt-1 text-sm text-white/70">Select how you want to login.</div>
            </div>
            <div className="px-6 pb-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsLoginMenuOpen(false);
                  navigate('/buyer/auth');
                }}
                className="w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-cyan-500/15 border border-white/10 text-white text-left transition-all"
              >
                Buyer Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLoginMenuOpen(false);
                  navigate('/seller/auth');
                }}
                className="w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-emerald-500/15 border border-white/10 text-white text-left transition-all"
              >
                Seller Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLoginMenuOpen(false);
                  navigate('/admin/login');
                }}
                className="w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-orange-500/15 border border-white/10 text-white text-left transition-all"
              >
                Admin Login
              </button>
              <button
                type="button"
                onClick={() => setIsLoginMenuOpen(false)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-center transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  ) : null;

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-white/10 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => scrollToSection('home')}
            >
              <img 
                src="/Logo.png" 
                alt="ScrowX" 
                className="h-16 w-auto filter brightness-150 contrast-150"
                style={{
                  filter: 'brightness(1.5) contrast(1.5) drop-shadow(0 0 20px rgba(6, 182, 212, 0.5))'
                }}
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent hidden sm:block">
                ScrowX
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              {/* Navigation Links */}
              {[
                { id: 'home', label: 'Home' },
                { id: 'how-it-works', label: 'How It Works' },
                { id: 'tutorial', label: 'Tutorial' },
                { id: 'founder', label: 'Founder' }
              ].map((item) => (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-sm font-medium transition-all duration-300 ${
                    activeNavItem === item.id
                      ? 'text-cyan-400'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {item.label}
                </motion.button>
              ))}

              {/* Auth Links */}
              <div className="flex items-center space-x-4 pl-4 border-l border-white/10">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(6, 182, 212, 0.6)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsLoginMenuOpen(true)}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
                >
                  Login
                </motion.button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl text-white hover:bg-white/10 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </motion.button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="lg:hidden py-4 border-t border-white/10"
              >
                <div className="flex flex-col space-y-3">
                  {/* Navigation Links */}
                  {[
                    { id: 'home', label: 'Home' },
                    { id: 'how-it-works', label: 'How It Works' },
                    { id: 'tutorial', label: 'Tutorial' },
                    { id: 'founder', label: 'Founder' }
                  ].map((item) => (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        scrollToSection(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`px-4 py-3 rounded-xl text-left font-medium transition-all ${
                        activeNavItem === item.id
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </motion.button>
                  ))}

                  {/* Divider */}
                  <div className="border-t border-white/10 my-2"></div>

                  {/* Auth Links */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsLoginMenuOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="px-4 py-3 rounded-xl text-left font-medium text-white/70 hover:bg-white/10 hover:text-cyan-400 transition-all"
                  >
                    Login
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>
      {loginMenu}
    </>
  );
};

export default StickyNav;
