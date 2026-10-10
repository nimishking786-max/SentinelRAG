import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'destructive' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' && 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20 hover:bg-cyan-300',
        variant === 'destructive' && 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-400',
        variant === 'outline' && 'border border-slate-700 bg-slate-900/60 text-slate-200 hover:border-cyan-400/60 hover:bg-slate-800',
        variant === 'ghost' && 'text-slate-400 hover:bg-slate-800/80 hover:text-white',
        variant === 'default' && 'border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700',
        size === 'sm' && 'h-9 px-3 text-xs',
        size === 'lg' && 'h-12 px-6',
        size === 'icon' && 'h-10 w-10',
        size === 'default' && 'h-10 px-4 text-sm',
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = 'Button';
