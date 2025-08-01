import React from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

const LoadingSpinner = ({ 
  size = 'md', 
  className = '', 
  text = null,
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const spinner = (
    <div className={clsx('flex items-center gap-2', className)}>
      <Loader2 className={clsx('animate-spin', sizeClasses[size])} />
      {text && (
        <span className={clsx(
          'text-gray-600',
          size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
        )}>
          {text}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;