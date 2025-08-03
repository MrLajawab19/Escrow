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
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-green-50 border-green-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-green-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className={`bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6 relative animate-fadeIn ${getBgColor()}`}>
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
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal; 