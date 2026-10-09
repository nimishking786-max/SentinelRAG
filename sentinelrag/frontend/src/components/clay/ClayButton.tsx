import React from 'react';

interface ClayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger';
}

export const ClayButton: React.FC<ClayButtonProps> = ({ className, variant = 'default', children, ...props }) => {
  const resolvedClass = variant === 'primary' 
    ? 'clay-btn-primary' 
    : variant === 'danger' 
    ? 'clay-btn-danger' 
    : 'clay-btn';

  return (
    <button 
      className={`${resolvedClass} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};
