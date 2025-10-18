import React from 'react';
import { motion } from 'framer-motion';

const FooterSection = ({ setShowTermsModal }) => {
  const footerSections = [
    {
      title: 'Company',
      links: ['About ScrowX', 'Our Vision', 'Investors & Partners', 'Blog', 'Careers']
    },
    {
      title: 'Products',
      links: ['ScrowX Escrow', 'AI Dispute Resolution', 'Order Tracking', 'API Integration', 'ScopeBox']
    },
    {
      title: 'Resources',
      links: ['Help Center', 'Documentation', 'Tutorials', 'Privacy Policy']
    },
    {
      title: 'Global Trust',
      links: ['Secure Cross-Border Transactions', 'Sustainability', 'Transparency Commitment', 'AI Ethics']
    }
  ];

  return (
    <footer className="relative py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/50 backdrop-blur-xl border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        {/* Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {footerSections.map((section, idx) => (
            <div key={idx}>
              <h4 className="text-white font-bold text-lg mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <motion.a
                      whileHover={{ x: 5, color: '#06b6d4' }}
                      href="#"
                      className="text-white/60 hover:text-cyan-400 transition-colors text-sm"
                    >
                      {link}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social & Newsletter */}
          <div>
            <h4 className="text-white font-bold text-lg mb-4">Connect</h4>
            <p className="text-white/60 text-sm mb-4">Follow us on social media</p>
            
            {/* Social Icons */}
            <div className="flex gap-3 mb-6">
              <motion.a
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                href="https://www.linkedin.com/company/scrowx"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.2, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
                href="https://github.com/MrLajawab19"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white hover:shadow-lg hover:shadow-gray-500/50 transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.840 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                href="https://www.youtube.com/@ScrowX"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white hover:shadow-lg hover:shadow-red-500/50 transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              </motion.a>
            </div>

            <p className="text-white/60 text-xs">
              Stay updated with our latest features
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/50 text-sm text-center md:text-left">
              © 2025 ScrowX. All rights reserved.
            </p>
            
            {/* Footer Links */}
            <div className="flex flex-wrap gap-6 justify-center text-sm">
              <motion.a
                whileHover={{ color: '#06b6d4' }}
                href="#home"
                className="text-white/50 hover:text-cyan-400 transition-colors"
              >
                Home
              </motion.a>
              <motion.a
                whileHover={{ color: '#06b6d4' }}
                href="#"
                className="text-white/50 hover:text-cyan-400 transition-colors"
              >
                About
              </motion.a>
              <motion.a
                whileHover={{ color: '#06b6d4' }}
                href="#"
                className="text-white/50 hover:text-cyan-400 transition-colors"
              >
                Privacy Policy
              </motion.a>
              <motion.button
                whileHover={{ color: '#06b6d4' }}
                onClick={() => setShowTermsModal(true)}
                className="text-white/50 hover:text-cyan-400 transition-colors"
              >
                Terms
              </motion.button>
              <motion.a
                whileHover={{ color: '#06b6d4' }}
                href="#"
                className="text-white/50 hover:text-cyan-400 transition-colors"
              >
                Contact
              </motion.a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
