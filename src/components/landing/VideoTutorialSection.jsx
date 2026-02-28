import React from 'react';

const VideoTutorialSection = () => {
  return (
    <section id="tutorial" className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-neutral-100">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 animate-fadeIn">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-navy-900">
            Watch Tutorial
          </h2>
          <p className="text-neutral-500 text-lg max-w-2xl mx-auto">
            Learn how to use ScrowX in just a few minutes.
          </p>
        </div>

        <div className="relative group">
          {/* Video Container */}
          <div className="relative rounded-2xl overflow-hidden shadow-elevation border border-neutral-200 bg-white p-2">
            <div className="relative rounded-xl overflow-hidden aspect-video bg-navy-900">
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
        </div>

        {/* Additional CTAs */}
        <div className="flex flex-wrap gap-4 justify-center mt-12 animate-fadeIn">
          <a
            href="https://www.youtube.com/watch?v=rA1r6EAZ5tw"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-sm transition-all duration-300 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 0a10 10 0 100 20 10 10 0 000-20zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>
            <span>Watch on YouTube</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default VideoTutorialSection;
