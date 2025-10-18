import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Import sub-components
import HeroSection from './landing/HeroSection';
import FeaturesSection from './landing/FeaturesSection';
import HowItWorksSection from './landing/HowItWorksSection';
import VideoTutorialSection from './landing/VideoTutorialSection';
import FounderSection from './landing/FounderSection';
import FooterSection from './landing/FooterSection';
import StickyNav from './landing/StickyNav';
import TermsModal from './landing/TermsModal';

const LandingPage = ({ onAuthClear }) => {
  const navigate = useNavigate();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState('home');
  
  // Scroll to top and clear auth on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    if (localStorage.getItem('buyerToken') || localStorage.getItem('sellerToken')) {
      localStorage.removeItem('buyerToken');
      localStorage.removeItem('buyerData');
      localStorage.removeItem('sellerToken');
      localStorage.removeItem('sellerData');
      onAuthClear();
    }
    
    // Hide the main app navbar on landing page
    const mainNav = document.querySelector('nav');
    if (mainNav) {
      mainNav.style.display = 'none';
    }
    
    // Show it again when component unmounts
    return () => {
      const mainNav = document.querySelector('nav');
      if (mainNav) {
        mainNav.style.display = '';
      }
    };
  }, [onAuthClear]);

  // Smooth scroll to section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveNavItem(sectionId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-teal-900/20 to-transparent"></div>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
        />
      </div>

      {/* Sticky Navigation */}
      <StickyNav 
        activeNavItem={activeNavItem}
        scrollToSection={scrollToSection}
        navigate={navigate}
      />

      {/* Main Content */}
      <div className="relative z-10">
        <HeroSection navigate={navigate} />
        <FeaturesSection />
        <HowItWorksSection />
        <VideoTutorialSection />
        <FounderSection />
        <FooterSection setShowTermsModal={setShowTermsModal} />
      </div>

      {/* Terms Modal */}
      <TermsModal show={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </div>
  );
};

export default LandingPage;
