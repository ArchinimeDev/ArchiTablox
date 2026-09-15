'use client';

import { forwardRef } from 'react';

type Variant = 'ghost' | 'primary' | 'secondary' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  ghost:
    'bg-transparent hover:bg-slate-900 text-slate-300 hover:text-slate-100',
  primary:
    'bg-amber-500 hover:bg-amber-400 active:bg-amber-500 text-slate-950 font-semibold',
  secondary:
    'bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200',
  danger:
    'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/60 text-red-400',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-2.5 text-xs rounded-lg',
  md: 'h-10 px-3.5 text-sm rounded-lg',
  lg: 'h-11 px-4 text-sm rounded-xl',
};

export const AnimatedButton = forwardRef<HTMLButtonElement, Props>(
  function AnimatedButton(
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          interactive
          inline-flex items-center justify-center gap-2
          font-medium
          disabled:opacity-50 disabled:cursor-not-allowed
          disabled:hover:transform-none
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-spin"
            >
              <path d="M21 12a9 9 0 1 1-6.22-8.56" />
            </svg>
            <span className="opacity-70">{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);