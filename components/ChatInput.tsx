'use client';

import React, { useRef, useState } from 'react';
import Button from './Button';

interface ChatInputProps {
  onSendMessage: (body: string) => Promise<void>;
}

export default function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      await onSendMessage(trimmed);
      setMessage('');
      // Keep focus on input for fast follow-up chats if browser supports it
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
      <textarea
        ref={textareaRef}
        rows={2}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message... (Enter to send)"
        disabled={sending}
        className="w-full border border-[#333] text-base px-3 py-2 bg-white text-[#111] outline-none focus:border-[#1a3a6b] resize-none"
        maxLength={1000}
      />
      <Button type="submit" disabled={sending || !message.trim()}>
        {sending ? 'Sending...' : 'Send'}
      </Button>
    </form>
  );
}
