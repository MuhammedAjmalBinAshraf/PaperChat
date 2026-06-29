'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { setDisplayName, getUID, getDisplayName } from '@/lib/storage';

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  // If already set up, redirect to home page
  useEffect(() => {
    const existingName = getDisplayName();
    if (existingName) {
      router.replace('/');
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    // Save user details
    setDisplayName(trimmed);
    // Generate/fetch UID to persist
    getUID();

    // Redirect to homepage
    router.push('/');
  };

  if (loading) {
    return <div className="py-8 text-base text-[#111]">Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-6 pt-8">
      <div className="text-left">
        <h1 className="text-2xl font-bold mb-2">What&apos;s your device called?</h1>
        <p className="text-base text-[#666]">
          This is how others will see you. You can change it later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          type="text"
          placeholder="e.g. John&apos;s Kindle"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          maxLength={30}
        />
        <Button type="submit" disabled={!name.trim()}>
          Start chatting
        </Button>
      </form>
    </div>
  );
}
