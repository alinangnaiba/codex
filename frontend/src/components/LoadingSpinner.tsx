import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`inline-block ${sizeClasses[size]} ${className}`}>
      <div className="relative w-full h-full">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-spin" 
             style={{ animationDuration: '1s' }}>
        </div>
        <div className="absolute inset-1 rounded-full bg-white dark:bg-gray-900"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-indigo-500 animate-spin"
             style={{ animationDuration: '0.75s' }}>
        </div>
      </div>
    </div>
  );
};
