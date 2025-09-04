'use client';

import React from 'react';
import { BookOpen, Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...', 
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-islamic-emerald/10 rounded-full p-3 mr-3">
                <BookOpen className="h-8 w-8 text-islamic-emerald" />
              </div>
              <Loader2 className="h-8 w-8 text-islamic-emerald animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Markaz An-noor</h2>
            <p className="text-gray-600">{text}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center space-x-2">
      <Loader2 className={`${sizeClasses[size]} text-islamic-emerald animate-spin`} />
      {text && (
        <span className={`${textSizeClasses[size]} text-gray-600 font-medium`}>
          {text}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;