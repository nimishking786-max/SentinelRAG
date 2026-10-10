import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface ThemedSelectOption {
  value: string;
  label: string;
}

interface ThemedSelectProps {
  value: string;
  options: ThemedSelectOption[];
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  title?: string;
  'aria-label'?: string;
}

export const ThemedSelect = ({
  value,
  options,
  onChange,
  className = '',
  disabled = false,
  title,
  'aria-label': ariaLabel,
}: ThemedSelectProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open]);

  if (!selected) return null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        title={title}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="technical-select flex min-h-[2.75rem] w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="truncate">{selected.label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className="technical-select-menu absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto p-1"
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`technical-select-option ${option.value === value ? 'is-selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
