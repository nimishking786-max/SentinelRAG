import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ClayCardProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

export const ClayCard: React.FC<ClayCardProps> = ({ className, inset = false, children, ...props }) => {
  return (
    <div 
      className={cn(inset ? "clay-card-inset" : "clay-card", "p-6", className)} 
      {...props}
    >
      {children}
    </div>
  );
};
