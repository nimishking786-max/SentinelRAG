import React from 'react';
import { cn } from '../../lib/utils';
export { cn };

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
