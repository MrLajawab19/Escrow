import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
    <div className="min-h-screen bg-main relative overflow-hidden">
      {/* Sticky Navigation */}
      <StickyNav
        activeNavItem={activeNavItem}
        scrollToSection={scrollToSection}
        navigate={navigate}
      />

      {/* Main Content */}
      <div className="relative z-10 pt-16">
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

