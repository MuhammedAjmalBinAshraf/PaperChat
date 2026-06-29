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
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // URL linking state
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [linkedUrl, setLinkedUrl] = useState('');
  const [linkedName, setLinkedName] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveLink = () => {
    const urlTrimmed = linkedUrl.trim();
    if (!urlTrimmed) return;

    let name = linkedName.trim();
    if (!name) {
      // Try to parse filename from URL
      try {
        const urlObj = new URL(urlTrimmed);
        name = urlObj.pathname.split('/').pop() || 'linked_file';
        if (!name) name = 'linked_file';
      } catch {
        name = 'linked_file';
      }
    }

    setAttachment({ url: urlTrimmed, name });
    setShowUrlInput(false);
    setLinkedUrl('');
    setLinkedName('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    let trimmed = message.trim();
    if (sending) return;
    if (!trimmed && !file && !attachment) return;

    setSending(true);
    setUploadError('');

    const sendMessage = (url: string, name: string) => {
      onSendMessage(trimmed, url, name)
        .then(() => {
          setMessage('');
          setFile(null);
          setAttachment(null);
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
      if (file.size > 4 * 1024 * 1024) {
        setUploadError('File is too large (max 4MB).');
        setSending(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomCode', roomCode);

      fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
        .then((res) => {
          if (!res.ok) {
            return res.json().then((errData) => {
              throw new Error(errData.error || 'Upload failed');
            });
          }
          return res.json();
        })
        .then((data) => {
          const attachmentUrl = data.url;
          const attachmentName = data.name;
          if (!trimmed) {
            trimmed = `Shared file: ${attachmentName}`;
          }
          sendMessage(attachmentUrl, attachmentName);
        })
        .catch((error) => {
          console.error('Failed to upload attachment:', error);
          const errMsg = error instanceof Error ? error.message : 'File upload failed.';
          setUploadError(errMsg);
          setSending(false);
        });
    } else if (attachment) {
      if (!trimmed) {
        trimmed = `Shared link: ${attachment.name}`;
      }
      sendMessage(attachment.url, attachment.name);
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

  if (showUrlInput) {
    return (
      <div className="border border-[#333] p-4 bg-white flex flex-col gap-3 text-left">
        <h3 className="text-base font-bold text-center">Link a File URL</h3>
        
        <div className="flex flex-col gap-1">
          <label className="text-base font-bold">File URL</label>
          <input
            type="url"
            placeholder="https://example.com/file.pdf"
            value={linkedUrl}
            onChange={(e) => setLinkedUrl(e.target.value)}
            className="w-full h-12 border border-[#333] text-base px-3 bg-white text-[#111] outline-none focus:border-[#1a3a6b]"
            autoFocus
          />
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-base font-bold">File Name (Optional)</label>
          <input
            type="text"
            placeholder="e.g., kobo_manual.pdf"
            value={linkedName}
            onChange={(e) => setLinkedName(e.target.value)}
            className="w-full h-12 border border-[#333] text-base px-3 bg-white text-[#111] outline-none focus:border-[#1a3a6b]"
          />
        </div>

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => {
              setShowUrlInput(false);
              setLinkedUrl('');
              setLinkedName('');
            }}
            className="w-1/2 h-12 bg-white text-[#111] border border-[#333] text-base font-medium cursor-pointer active:bg-[#f0f0f0]"
          >
            Cancel
          </button>
          <Button
            type="button"
            onClick={handleSaveLink}
            disabled={!linkedUrl.trim()}
            className="w-1/2"
          >
            Add Link
          </Button>
        </div>
      </div>
    );
  }

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

      {attachment && (
        <div className="flex justify-between items-center p-2 border border-[#333] bg-[#f0f0f0] text-base">
          <span className="truncate pr-2 font-bold">📎 {attachment.name} (Linked)</span>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="text-red-700 underline font-bold px-2 py-1 min-h-12 flex items-center cursor-pointer active:bg-red-50"
          >
            Remove
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || !!file || !!attachment}
            className="w-1/2 h-12 bg-[#f0f0f0] text-[#111] border border-[#333] text-base font-medium cursor-pointer active:bg-[#e0e0e0] flex items-center justify-center"
          >
            Attach File
          </button>
          <button
            type="button"
            onClick={() => {
              setUploadError('');
              setShowUrlInput(true);
            }}
            disabled={sending || !!file || !!attachment}
            className="w-1/2 h-12 bg-[#f0f0f0] text-[#111] border border-[#333] text-base font-medium cursor-pointer active:bg-[#e0e0e0] flex items-center justify-center"
          >
            Link File URL
          </button>
        </div>
        
        <Button type="submit" disabled={sending || (!message.trim() && !file && !attachment)} className="w-full">
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
