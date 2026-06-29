import React from 'react';

export default function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full h-12 border border-[#333] text-base px-3 bg-white text-[#111] outline-none focus:border-[#1a3a6b] ${className}`}
      {...props}
    />
  );
}
