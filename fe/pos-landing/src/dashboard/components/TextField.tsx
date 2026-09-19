import type React from 'react';
import { cn } from '@/lib/cn';

interface TextFieldProps {
  /**
   * ReactNode, not string: the comparison tab labels its columns with an icon
   * beside the name (`<Icon/> JMarkets POS`), and the plain-string type made
   * three correct call sites fail to compile.
   */
  label?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  type?: 'text' | 'email' | 'url' | 'password';
  className?: string;
  inputClassName?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Reusable text input field with consistent styling
 * Supports label, hint, error states, and various input types
 * 
 * @example
 * <TextField
 *   label="Site Title"
 *   value={title}
 *   onChange={setTitle}
 *   hint="Displayed in browser tab"
 * />
 */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  type = 'text',
  className,
  inputClassName,
  required,
  disabled,
}: TextFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full h-10 rounded-md border bg-background px-3 text-sm focus:outline-none transition',
          error
            ? 'border-destructive focus:border-destructive'
            : 'border-border focus:border-primary',
          disabled && 'opacity-50 cursor-not-allowed',
          type === 'url' || type === 'email' ? 'font-mono' : '',
          inputClassName
        )}
      />
      {hint && !error && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
