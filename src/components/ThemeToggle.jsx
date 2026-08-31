import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
      className={`p-2 text-neutral-600 dark:text-dark-muted dark:text-dark-muted dark:text-dark-muted hover:text-navy-900 dark:text-dark-primary dark:text-dark-primary dark:hover:text-dark-primary rounded-full hover:bg-neutral-100 dark:bg-dark-elevated dark:bg-dark-elevated dark:hover:bg-dark-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-dark-accent flex-shrink-0 flex items-center justify-center ${className}`}
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

export default ThemeToggle;
