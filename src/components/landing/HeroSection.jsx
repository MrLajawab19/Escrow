import React from 'react';
import { motion } from 'framer-motion';

const HeroSection = ({ navigate }) => {
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <section id="home" className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-7xl mx-auto text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-8"
        >
          {/* Logo with Glow */}
          <motion.div variants={fadeInUp} className="relative">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 flex justify-center items-center"
            >
              <div className="w-72 h-72 bg-gradient-radial from-cyan-400/40 via-teal-400/20 to-transparent rounded-full blur-3xl"></div>
            </motion.div>
            <img 
              src="/Logo.png" 
              alt="ScrowX Logo" 
              className="relative z-10 mx-auto h-40 w-auto filter brightness-150 contrast-150"
              style={{
                filter: 'brightness(1.5) contrast(1.5) drop-shadow(0 0 40px rgba(6, 182, 212, 0.8))'
              }}
            />
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={fadeInUp}
            className="text-5xl sm:text-6xl lg:text-7xl font-black bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent leading-tight"
          >
            Welcome to ScrowX
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeInUp}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent"
          >
            AI that automates trust in every deal
          </motion.p>

          {/* Description */}
          <motion.p
            variants={fadeInUp}
            className="text-lg sm:text-xl lg:text-2xl max-w-4xl mx-auto text-white/90 font-medium leading-relaxed"
          >
            Secure escrow platform for freelance and digital product transactions. 
            Protect your payments and ensure fair delivery with cutting-edge technology.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(6, 182, 212, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/buyer/auth')}
              className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-teal-600 text-white text-lg font-bold rounded-2xl shadow-2xl transition-all duration-300 flex items-center space-x-3 group"
            >
              <span className="group-hover:animate-bounce">🚀</span>
              <span>Get Started as Buyer</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(16, 185, 129, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/seller/auth')}
              className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-lg font-bold rounded-2xl shadow-2xl transition-all duration-300 flex items-center space-x-3 group"
            >
              <span className="group-hover:animate-bounce">💼</span>
              <span>Join as Seller</span>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
