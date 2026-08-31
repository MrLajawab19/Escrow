import React from 'react';

const NotificationModal = ({ isOpen, onClose, title, message, type = 'success' }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '✅';
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900/50';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/50';
      default:
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800 dark:text-green-400';
      case 'error':
        return 'text-red-800 dark:text-red-400';
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-400';
      case 'info':
        return 'text-blue-800 dark:text-blue-400';
      default:
        return 'text-green-800 dark:text-green-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className={`bg-white dark:bg-dark-surface rounded-lg shadow-lg max-w-md w-full mx-4 p-6 relative animate-fadeIn ${getBgColor()}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 text-2xl">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold mb-2 ${getTextColor()}`}>
              {title}
            </h3>
            <p className={`text-sm ${getTextColor()}`}>
              {message}
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 dark:bg-dark-elevated text-white dark:text-dark-primary rounded-md hover:bg-gray-700 dark:hover:bg-dark-surface focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-dark-border transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal; 