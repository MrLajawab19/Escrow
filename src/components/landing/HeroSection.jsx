import React from 'react';

const HeroSection = ({ navigate }) => {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 bg-main text-navy-900">
      <div className="max-w-4xl mx-auto text-center">
        <div className="space-y-8 animate-fadeIn">
          {/* Logo */}
          <div className="relative mb-8">
            <img
              src="/Logo.png"
              alt="ScrowX Logo"
              className="relative z-10 mx-auto h-24 sm:h-32 w-auto object-contain"
            />
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-navy-900 leading-tight">
            Secure Infrastructure for <span className="text-primary-500">Digital Transactions</span>
          </h1>

          {/* Subtitle */}
          <p className="text-2xl sm:text-3xl font-medium text-neutral-600">
            Automating trust in every deal.
          </p>

          {/* Description */}
          <p className="text-lg sm:text-xl max-w-3xl mx-auto text-neutral-500 font-normal leading-relaxed">
            The premium escrow platform for freelance work and digital products.
            Protect your payments and ensure fair delivery with enterprise-grade security.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <button
              onClick={() => navigate('/buyer/auth')}
              className="btn btn-primary w-full sm:w-auto px-8 py-4 text-lg shadow-elevated"
            >
              Get Started as Buyer
            </button>
            <button
              onClick={() => navigate('/seller/auth')}
              className="btn btn-outline w-full sm:w-auto px-8 py-4 text-lg bg-white"
            >
              Join as Seller
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
