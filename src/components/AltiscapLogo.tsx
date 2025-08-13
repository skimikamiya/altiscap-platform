import React from 'react';

interface AltiscapLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const AltiscapLogo: React.FC<AltiscapLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-24 w-auto'
  };

  return (
    <img 
      src="/altiscap-logo.png" 
      alt="ALTISCAP Logo" 
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};

export default AltiscapLogo;

