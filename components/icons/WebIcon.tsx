import React from 'react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const WebIcon: React.FC<IconProps> = ({ className, active = false }) => {
  const baseUrl = "https://img.icons8.com/?size=100&id=53450&format=png&color=";
  
  // Use white color for the icon when the tab is active, otherwise use the theme color.
  const color = active ? "FFFFFF" : "ba2087";
  
  const iconUrl = `${baseUrl}${color}`;

  return (
    <img
      src={iconUrl}
      alt="Web Icon"
      className={className}
    />
  );
};
