import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function Button({ children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`w-full h-12 bg-[#1a3a6b] text-white text-base font-medium border-none cursor-pointer active:bg-[#0f2447] flex items-center justify-center ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
