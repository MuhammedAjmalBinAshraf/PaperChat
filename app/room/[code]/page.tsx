'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDisplayName, getUID, addToHistory } from '@/lib/storage';
import MessageList from '@/components/MessageList';
import ChatInput from '@/components/ChatInput';

interface RoomPageProps {
  params: {
    code: string;
  };
}

export default function RoomPage({ params }: RoomPageProps) {
  const router = useRouter();
  const code = params.code;
  const [displayName, setDisplayName] = useState('');
  const [checkingRoom, setCheckingRoom] = useState(true);
  const [roomNotFound, setRoomNotFound] = useState(false);

  useEffect(() => {
    const name = getDisplayName();
    if (!name) {
      router.replace('/setup');
      return;
    }
    setDisplayName(name);

    async function verifyAndRegisterRoom() {
      try {
        const res = await fetch(`/api/rooms/${code}`);
        if (!res.ok) {
          setRoomNotFound(true);
        } else {
          const roomData = await res.json();
          const roomName = roomData.name || `Room ${code}`;
          // Record visited room in local history
          addToHistory(code, roomName);
        }
      } catch (err) {
        console.error('Error verifying room:', err);
        setRoomNotFound(true);
      } finally {
        setCheckingRoom(false);
      }
    }

    verifyAndRegisterRoom();
  }, [code, router]);

  const handleSendMessage = async (body: string, attachmentUrl?: string, attachmentName?: string) => {
    const uid = getUID();
    const currentName = getDisplayName() || 'Unknown Device';

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        uid,
        display_name: currentName,
        body,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to send message');
    }
  };

  if (checkingRoom) {
    return <div className="py-8 text-base text-[#111]">Loading...</div>;
  }

  if (roomNotFound) {
    return (
      <div className="py-12 text-center text-base flex flex-col gap-4">
        <h1 className="text-xl font-bold">Room not found.</h1>
        <p className="text-base text-[#666]">
          The room with PIN #{code} could not be found or does not exist.
        </p>
        <div>
          <a href="/" className="text-[#1a3a6b] underline font-medium">
            Go back to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Top minimal bar */}
      <div className="flex justify-between items-center border-b border-[#333] pb-2 mb-4 shrink-0">
        <span className="text-xl font-bold"># {code}</span>
        <span className="text-base text-[#666] font-medium">{displayName}</span>
      </div>

      {/* Message List */}
      <MessageList code={code} />

      {/* Message Input */}
      <div className="shrink-0 mt-auto pt-2 bg-white">
        <ChatInput onSendMessage={handleSendMessage} roomCode={code} />
        {/* Simple back navigation helper below form for user convenience */}
        <div className="mt-4 text-center">
          <a href="/" className="text-sm text-[#666] underline">
            Leave room
          </a>
        </div>
      </div>
    </div>
  );
}
