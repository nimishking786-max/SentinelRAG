import React from 'react';

interface ClayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger';
}

export const ClayButton: React.FC<ClayButtonProps> = ({ className, variant = 'default', children, ...props }) => {
  const resolvedClass = variant === 'primary' 
    ? 'neubrutalist-btn-primary' 
    : variant === 'danger' 
    ? 'neubrutalist-btn-danger' 
    : 'neubrutalist-btn';

  return (
    <button 
      className={`${resolvedClass} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};
