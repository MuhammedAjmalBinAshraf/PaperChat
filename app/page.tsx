'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import PinInput from '@/components/PinInput';
import { getDisplayName, getHistory, HistoryEntry } from '@/lib/storage';

export default function HomePage() {
  const router = useRouter();
  const [displayName, setDisplayNameState] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showJoin, setShowJoin] = useState(false);
  const [pin, setPin] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    const name = getDisplayName();
    if (!name) {
      router.replace('/setup');
    } else {
      setDisplayNameState(name);
      setHistory(getHistory());
      setLoading(false);
    }
  }, [router]);

  const handleCreateRoom = async () => {
    setJoining(true);
    setJoinError('');
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${displayName}'s Room` }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to create room');
      }

      const data = await res.json();
      router.push(`/room/${data.code}`);
    } catch (err) {
      console.error(err);
      setJoinError('Failed to create room. Please try again.');
      setJoining(false);
    }
  };

  const handleJoinRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length !== 4 || joining) return;

    setJoining(true);
    setJoinError('');
    try {
      const res = await fetch(`/api/rooms/${pin}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Room not found');
        }
        throw new Error('Failed to join room');
      }

      router.push(`/room/${pin}`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Error joining room';
      setJoinError(errMsg);
      setJoining(false);
    }
  };

  if (loading) {
    return <div className="py-8 text-base text-[#111]">Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-8 pt-4">
      {/* Top Welcome Bar */}
      <div className="flex justify-between items-baseline border-b border-[#333] pb-3">
        <span className="text-lg font-bold">Welcome, {displayName}</span>
        <Link href="/profile" className="text-base text-[#1a3a6b] underline">
          Edit profile
        </Link>
      </div>

      {/* Main Buttons */}
      <div className="flex flex-col gap-4">
        {/* Create Room Button */}
        {!showJoin && (
          <button
            onClick={handleCreateRoom}
            disabled={joining}
            className="w-full h-14 bg-[#1a3a6b] text-white text-base font-medium border-none cursor-pointer active:bg-[#0f2447] flex items-center justify-center"
          >
            {joining ? 'Creating...' : 'Create a Room'}
          </button>
        )}

        {/* Join Room Section */}
        {!showJoin ? (
          <button
            onClick={() => {
              setJoinError('');
              setShowJoin(true);
            }}
            disabled={joining}
            className="w-full h-14 bg-[#f0f0f0] text-[#111] text-base font-medium border border-[#333] cursor-pointer active:bg-[#e0e0e0] flex items-center justify-center"
          >
            Join a Room
          </button>
        ) : (
          <div className="border border-[#333] p-4 bg-white flex flex-col gap-2">
            <h3 className="text-base font-bold text-center">Enter 4-Digit Room PIN</h3>
            
            <PinInput
              onChange={(value) => {
                setPin(value);
                setJoinError('');
              }}
              onComplete={(value) => {
                setPin(value);
              }}
            />

            {joinError && (
              <div className="text-sm text-red-700 text-center font-bold mb-2">
                {joinError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowJoin(false);
                  setPin('');
                  setJoinError('');
                }}
                className="w-1/2 h-12 bg-white text-[#111] border border-[#333] text-base font-medium cursor-pointer active:bg-[#f0f0f0]"
              >
                Cancel
              </button>
              <Button
                onClick={() => handleJoinRoom()}
                disabled={pin.length !== 4 || joining}
                className="w-1/2"
              >
                {joining ? 'Joining...' : 'Join'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Room History Section */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-bold border-b border-[#e0e0e0] pb-1">
          Recent Rooms
        </h2>
        {history.length === 0 ? (
          <p className="text-base text-[#666] italic">No recently visited rooms</p>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((entry) => (
              <Link
                key={entry.code}
                href={`/room/${entry.code}`}
                className="block p-3 border border-[#333] bg-white text-[#111] text-base active:bg-[#f0f0f0]"
              >
                <div className="flex justify-between items-center">
                  <span>
                    <strong className="font-bold">#{entry.code}</strong> - {entry.name}
                  </span>
                  <span className="text-xs text-[#666]">
                    {new Date(entry.lastVisited).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
