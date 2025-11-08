
import React from 'react';

interface IconProps {
  className?: string;
}

export const BrowserIcon: React.FC<IconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
    <line x1="2" y1="10" x2="22" y2="10"></line>
    <line x1="6" y1="6" x2="6" y2="6"></line>
    <line x1="10" y1="6" x2="10" y2="6"></line>
  </svg>
);
