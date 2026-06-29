'use client';

import React, { useRef, useState } from 'react';
import Button from './Button';

interface ChatInputProps {
  onSendMessage: (body: string, attachmentUrl?: string, attachmentName?: string) => Promise<void>;
  roomCode: string;
}

export default function ChatInput({ onSendMessage, roomCode }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    let trimmed = message.trim();
    if (sending) return;
    if (!trimmed && !file) return;

    setSending(true);
    setUploadError('');

    const sendMessage = (url: string, name: string) => {
      onSendMessage(trimmed, url, name)
        .then(() => {
          setMessage('');
          setFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          // Focus back to input
          textareaRef.current?.focus();
        })
        .catch((error) => {
          console.error('Failed to send message:', error);
          const errMsg = error instanceof Error ? error.message : 'Failed to send message.';
          setUploadError(errMsg);
        })
        .finally(() => {
          setSending(false);
        });
    };

    if (file) {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${roomCode}/${timestamp}_${safeName}`;

      import('@/lib/supabase')
        .then(({ supabase }) => {
          return supabase.storage
            .from('attachments')
            .upload(filePath, file)
            .then((uploadRes) => {
              if (uploadRes.error) {
                throw new Error(`File upload failed: ${uploadRes.error.message}`);
              }
              return supabase.storage.from('attachments').getPublicUrl(filePath);
            });
        })
        .then((urlData) => {
          const attachmentUrl = urlData.data.publicUrl;
          const attachmentName = file.name;
          if (!trimmed) {
            trimmed = `Shared file: ${file.name}`;
          }
          sendMessage(attachmentUrl, attachmentName);
        })
        .catch((error) => {
          console.error('Failed to upload attachment:', error);
          const errMsg = error instanceof Error ? error.message : 'File upload failed.';
          setUploadError(errMsg);
          setSending(false);
        });
    } else {
      sendMessage('', '');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
      {uploadError && (
        <div className="text-base text-red-700 font-bold border border-red-700 p-2 bg-red-50">
          {uploadError}
        </div>
      )}

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

      {file && (
        <div className="flex justify-between items-center p-2 border border-[#333] bg-[#f0f0f0] text-base">
          <span className="truncate pr-2 font-bold">📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
          <button
            type="button"
            onClick={() => {
              setFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="text-red-700 underline font-bold px-2 py-1 min-h-12 flex items-center cursor-pointer active:bg-red-50"
          >
            Remove
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          className="w-1/2 h-12 bg-[#f0f0f0] text-[#111] border border-[#333] text-base font-medium cursor-pointer active:bg-[#e0e0e0] flex items-center justify-center"
        >
          Attach File
        </button>
        <Button type="submit" disabled={sending || (!message.trim() && !file)} className="w-1/2">
          {sending ? 'Sending...' : 'Send'}
        </Button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />
    </form>
  );
}
