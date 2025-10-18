import React from 'react';
import { motion } from 'framer-motion';

const FeaturesSection = () => {
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

  const features = [
    {
      icon: '⚖️',
      title: 'Dispute Resolution',
      description: 'Raise disputes and track resolution with evidence upload. Our AI-powered system ensures fair resolution for all parties.',
      gradient: 'from-cyan-500/10 to-blue-500/10',
      hoverGradient: 'group-hover:from-cyan-500/20 group-hover:to-blue-500/20'
    },
    {
      icon: '🔒',
      title: 'ScrowX',
      description: 'Funds held securely with blockchain-level encryption until both parties are satisfied. No more payment disputes.',
      gradient: 'from-teal-500/10 to-cyan-500/10',
      hoverGradient: 'group-hover:from-teal-500/20 group-hover:to-cyan-500/20'
    },
    {
      icon: '📊',
      title: 'Order Tracking',
      description: 'Real-time order status updates and timeline tracking with advanced analytics. Stay informed throughout.',
      gradient: 'from-emerald-500/10 to-teal-500/10',
      hoverGradient: 'group-hover:from-emerald-500/20 group-hover:to-teal-500/20'
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ y: -10, scale: 1.02 }}
              className={`group relative overflow-hidden bg-gradient-to-br ${feature.gradient} ${feature.hoverGradient} backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center transition-all duration-500 shadow-xl hover:shadow-2xl`}
            >
              {/* Card glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <motion.div
                whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.2 }}
                transition={{ duration: 0.5 }}
                className="text-6xl mb-6"
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
              <p className="text-white/80 text-base leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
