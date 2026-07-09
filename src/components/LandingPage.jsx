import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Import New Components
import LandingNavbar from './landing/LandingNavbar';
import HeroEmbedded from './landing/HeroEmbedded';
import InteractiveTimeline from './landing/InteractiveTimeline';
import ScopeBoxPreview from './landing/ScopeBoxPreview';
import DisputeComparison from './landing/DisputeComparison';
import FounderStory from './landing/FounderStory';
import FinalCTA from './landing/FinalCTA';
import AuthModal from './landing/AuthModal';

// Import Preserved Components
import FooterSection from './landing/FooterSection';
import TermsModal from './landing/TermsModal';

const LandingPage = ({ onAuthClear }) => {
  const navigate = useNavigate();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Security and layout setup on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Clear auth state if visiting public homepage
    if (localStorage.getItem('buyerToken') || localStorage.getItem('sellerToken')) {
      localStorage.removeItem('buyerToken');
      localStorage.removeItem('buyerData');
      localStorage.removeItem('sellerToken');
      localStorage.removeItem('sellerData');
      onAuthClear();
    }

    // Hide the main app navbar on landing page so it doesn't conflict with LandingNavbar
    const mainNav = document.querySelector('nav');
    if (mainNav && !mainNav.classList.contains('fixed')) { // ensure it's not our new LandingNavbar
      mainNav.style.display = 'none';
    }

    // Cleanup when component unmounts
    return () => {
      const mainNav = document.querySelector('nav');
      if (mainNav) {
        mainNav.style.display = '';
      }
    };
  }, [onAuthClear]);

  const handleAuthClick = () => {
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-white relative font-inter text-neutral-900 selection:bg-primary-100 selection:text-primary-900">
      
      {/* 1. Navigation */}
      <LandingNavbar onAuthClick={handleAuthClick} />

      {/* Main Content Flow */}
      <main className="relative z-10">
        
        {/* 2. Hero Section (Deal Initiation) */}
        <HeroEmbedded onAuthClick={handleAuthClick} />

        {/* 3. Interactive Transaction Flow */}
        <InteractiveTimeline />

        {/* 4. ScopeBox Preview */}
        <ScopeBoxPreview />

        {/* 5. Dispute Resolution (Dark Section) */}
        <DisputeComparison />

        {/* 6. Final Conversion (Ready to start) */}
        <FinalCTA onAuthClick={handleAuthClick} />

        {/* 7. Founder Story */}
        <FounderStory />

      </main>

      {/* 8. Preserved Legacy Footer (Links and Modals) */}
      <FooterSection setShowTermsModal={setShowTermsModal} />

      {/* Auth Selection Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        navigate={navigate} 
      />

      {/* Preserved Legal Modal */}
      <TermsModal show={showTermsModal} onClose={() => setShowTermsModal(false)} />
      
    </div>
  );
};

export default LandingPage;
