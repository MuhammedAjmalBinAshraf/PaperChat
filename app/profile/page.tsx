'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { getDisplayName, setDisplayName, getUID, clearHistory } from '@/lib/storage';

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [uid, setUid] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const existingName = getDisplayName();
    if (!existingName) {
      router.replace('/setup');
    } else {
      setName(existingName);
      setUid(getUID());
      setLoading(false);
    }
  }, [router]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setDisplayName(trimmed);
    setStatusMessage('Name saved successfully.');
    
    // Clear status message after 3 seconds
    setTimeout(() => {
      setStatusMessage('');
    }, 3000);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your room history?')) {
      clearHistory();
      setStatusMessage('History cleared.');
      setTimeout(() => {
        setStatusMessage('');
      }, 3000);
    }
  };

  if (loading) {
    return <div className="py-8 text-base text-[#111]">Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-6 pt-4 text-left">
      <div>
        <h1 className="text-2xl font-bold mb-1">Profile settings</h1>
        <p className="text-base text-[#666]">
          Manage your device identification and history.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 bg-[#f0f0f0] border border-[#333] text-base font-bold text-center">
          {statusMessage}
        </div>
      )}

      {/* Save Name Form */}
      <form onSubmit={handleSaveName} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-base font-bold">Device Name</label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={30}
          />
        </div>
        <Button type="submit" disabled={!name.trim()}>
          Save name
        </Button>
      </form>

      {/* Read-only Device ID */}
      <div className="border-t border-[#e0e0e0] pt-4">
        <label className="text-base font-bold block mb-1">Device ID (UID)</label>
        <span className="text-sm font-mono bg-[#f0f0f0] p-2 block border border-[#333] break-all select-all">
          {uid}
        </span>
        <p className="text-xs text-[#666] mt-1">
          This ID persists in your browser to identify your messages.
        </p>
      </div>

      {/* Clear History */}
      <div className="border-t border-[#e0e0e0] pt-4 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleClearHistory}
          className="w-full h-12 bg-white text-red-700 border border-red-700 text-base font-medium cursor-pointer active:bg-red-50"
        >
          Clear history
        </button>
      </div>

      {/* Back Link */}
      <div className="border-t border-[#e0e0e0] pt-4 text-center">
        <a href="/" className="text-[#1a3a6b] underline text-base font-medium inline-block py-2">
          Back to home
        </a>
      </div>
    </div>
  );
}
