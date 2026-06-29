'use client';

import React, { useRef, useState, useEffect } from 'react';

interface PinInputProps {
  onChange: (pin: string) => void;
  onComplete?: (pin: string) => void;
}

export default function PinInput({ onChange, onComplete }: PinInputProps) {
  const [values, setValues] = useState<string[]>(['', '', '', '']);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const handleChange = (index: number, rawVal: string) => {
    // Only accept numeric digits
    const digit = rawVal.replace(/[^0-9]/g, '').slice(-1);
    
    const newValues = [...values];
    newValues[index] = digit;
    setValues(newValues);
    
    const currentPin = newValues.join('');
    onChange(currentPin);

    // Auto-advance if a digit was typed
    if (digit && index < 3) {
      refs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!values[index] && index > 0) {
        // Clear previous input and focus it
        const newValues = [...values];
        newValues[index - 1] = '';
        setValues(newValues);
        onChange(newValues.join(''));
        refs[index - 1].current?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{4}$/.test(pastedData)) {
      const chars = pastedData.split('');
      setValues(chars);
      onChange(pastedData);
      refs[3].current?.focus();
    }
  };

  // Check if fully filled
  useEffect(() => {
    const pin = values.join('');
    if (pin.length === 4 && onComplete) {
      onComplete(pin);
    }
  }, [values, onComplete]);

  return (
    <div className="flex justify-between gap-2 my-4">
      {values.map((val, idx) => (
        <input
          key={idx}
          ref={refs[idx]}
          type="text"
          maxLength={1}
          inputMode="numeric"
          pattern="[0-9]*"
          value={val}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={idx === 0 ? handlePaste : undefined}
          className="w-12 h-14 text-center text-2xl font-bold border border-[#333] bg-white text-[#111] focus:border-[#1a3a6b] outline-none"
          autoComplete="off"
        />
      ))}
    </div>
  );
}
