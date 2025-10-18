import React from 'react';
import { motion } from 'framer-motion';

const HowItWorksSection = () => {
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

  const steps = [
    {
      step: '01',
      title: 'Create Order',
      description: 'Buyer creates an order with detailed requirements',
      icon: '📝',
      color: 'from-cyan-500 to-blue-500'
    },
    {
      step: '02',
      title: 'Fund Escrow',
      description: 'Payment is held securely in escrow',
      icon: '🔒',
      color: 'from-blue-500 to-teal-500'
    },
    {
      step: '03',
      title: 'Work & Deliver',
      description: 'Seller completes work and submits delivery',
      icon: '⚡',
      color: 'from-teal-500 to-emerald-500'
    },
    {
      step: '04',
      title: 'Release Funds',
      description: 'Buyer approves and funds are released',
      icon: '✅',
      color: 'from-emerald-500 to-green-500'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <h2 className="text-4xl sm:text-5xl font-black text-center mb-4 bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-center text-white/70 text-lg mb-16 max-w-2xl mx-auto">
            Simple, secure, and transparent process for every transaction
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative"
        >
          {/* Connection Lines for Desktop */}
          <div className="hidden lg:block absolute top-20 left-0 right-0 h-1">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
          </div>

          {steps.map((item, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ y: -10, scale: 1.05 }}
              className="relative text-center group"
            >
              {/* Step Card */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 transition-all duration-500 shadow-xl hover:shadow-2xl hover:border-white/40">
                {/* Step Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-6 shadow-lg relative z-10`}
                >
                  <span className="text-3xl">{item.icon}</span>
                </motion.div>

                {/* Step Badge */}
                <div className={`inline-block px-4 py-1 rounded-full bg-gradient-to-r ${item.color} text-white text-sm font-bold mb-4`}>
                  Step {item.step}
                </div>

                <h4 className="font-bold text-white text-xl mb-3">{item.title}</h4>
                <p className="text-white/70 text-sm leading-relaxed">{item.description}</p>
              </div>

              {/* Arrow for Desktop */}
              {index < 3 && (
                <div className="hidden lg:block absolute top-10 -right-4 text-cyan-400/50 text-3xl z-0">
                  →
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
