import React from 'react';
import { motion } from 'framer-motion';

const VideoTutorialSection = () => {
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  const scaleIn = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <section id="tutorial" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-black mb-4 bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Watch Tutorial
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Learn how to use ScrowX in just a few minutes
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={scaleIn}
          whileHover={{ scale: 1.02 }}
          className="relative group"
        >
          {/* Video Container */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 p-2">
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-black">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/rA1r6EAZ5tw"
                title="ScrowX Tutorial"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
        </motion.div>

        {/* Additional CTAs */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="flex flex-wrap gap-4 justify-center mt-12"
        >
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="https://www.youtube.com/watch?v=rA1r6EAZ5tw"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center space-x-2"
          >
            <span>▶</span>
            <span>Watch on YouTube</span>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default VideoTutorialSection;
