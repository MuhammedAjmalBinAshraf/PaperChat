'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getUID } from '@/lib/storage';

export interface MessageType {
  id: string;
  room_code: string;
  uid: string;
  display_name: string;
  body: string;
  created_at: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
}

interface MessageListProps {
  code: string;
}

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const hrs = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${hrs}:${mins}`;
  } catch {
    return '';
  }
}

function getInitials(name: string): string {
  if (!name) return '??';
  const cleanName = name.replace(/[^\w\s]/g, '').trim();
  const parts = cleanName.split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleanName.substring(0, 2).toUpperCase();
}

export default function MessageList({ code }: MessageListProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentUid, setCurrentUid] = useState('');
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCurrentUid(getUID());
  }, []);
  const [pollingActive, setPollingActive] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<MessageType[]>([]);
  const prevLastMessageIdRef = useRef<string | null>(null);

  // Keep messagesRef updated for polling closure access
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Initial Fetch
  useEffect(() => {
    function fetchInitial() {
      fetch(`/api/messages?code=${code}`)
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          throw new Error('Failed to fetch');
        })
        .then((data) => {
          setMessages(data.messages || []);
          if (data.messages && data.messages.length < 100) {
            setHasMore(false);
          }
        })
        .catch((error) => {
          console.error('Failed to fetch initial messages:', error);
        })
        .finally(() => {
          setInitialLoading(false);
        });
    }
    fetchInitial();
  }, [code]);

  // Realtime Connection + Polling Fallback Setup
  useEffect(() => {
    if (initialLoading) return;

    const isKindleOrKobo = typeof navigator !== 'undefined' && /Kindle|Kobo/i.test(navigator.userAgent);
    if (isKindleOrKobo) {
      console.log('Kindle/Kobo detected. Bypassing Realtime and using polling directly.');
      setPollingActive(true);
      return;
    }

    let isSubscribed = false;
    let channel: RealtimeChannel | null = null;

    try {
      if (typeof window !== 'undefined' && 'WebSocket' in window && window.WebSocket) {
        // Set up Realtime subscription
        import('@/lib/supabase')
          .then(({ supabase }) => {
            channel = supabase
              .channel(`room:${code}`)
              .on(
                'postgres_changes',
                {
                  event: 'INSERT',
                  schema: 'public',
                  table: 'messages',
                  filter: `room_code=eq.${code}`,
                },
                (payload) => {
                  const newMsg = payload.new as MessageType;
                  setMessages((prev) => {
                    if (prev.some((m) => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                  });
                }
              )
              .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                  isSubscribed = true;
                  console.log('Supabase Realtime connected successfully.');
                }
              });
          })
          .catch((err) => {
            console.warn('Failed to load Supabase dynamically:', err);
            setPollingActive(true);
          });
      } else {
        console.log('WebSockets not supported in this browser. Activating polling.');
        setPollingActive(true);
      }
    } catch (err) {
      console.warn('Failed to initialize Supabase Realtime channel:', err);
      setPollingActive(true);
    }

    // 3-second connection timeout check
    const connectionTimeout = setTimeout(() => {
      if (!isSubscribed) {
        console.log('Supabase Realtime connection timed out or not supported. Activating polling.');
        setPollingActive(true);
        // Unsubscribe from WebSocket to save client resources
        try {
          if (channel) {
            channel.unsubscribe();
          }
        } catch (err) {
          console.warn('Error unsubscribing channel on timeout:', err);
        }
      }
    }, 3000);

    return () => {
      clearTimeout(connectionTimeout);
      try {
        if (channel) {
          channel.unsubscribe();
        }
      } catch (err) {
        console.warn('Error unsubscribing channel on cleanup:', err);
      }
    };
  }, [code, initialLoading]);

  // Polling Interval
  useEffect(() => {
    if (!pollingActive) return;

    const interval = setInterval(() => {
      const currentMessages = messagesRef.current;
      const latestMsg = currentMessages[currentMessages.length - 1];
      const since = latestMsg ? latestMsg.created_at : new Date(0).toISOString();

      fetch(`/api/messages?code=${code}&since=${encodeURIComponent(since)}`)
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          throw new Error('Failed to poll');
        })
        .then((data) => {
          if (data.messages && data.messages.length > 0) {
            setMessages((prev) => {
              const newMsgs = data.messages.filter(
                (m: MessageType) => !prev.some((p) => p.id === m.id)
              );
              if (newMsgs.length === 0) return prev;
              return [...prev, ...newMsgs];
            });
          }
        })
        .catch((error) => {
          console.error('Failed to poll new messages:', error);
        });
    }, 5000);

    return () => clearInterval(interval);
  }, [pollingActive, code]);

  // Scroll to bottom on new message additions
  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;
  useEffect(() => {
    if (initialLoading) return;

    if (lastMessageId !== prevLastMessageIdRef.current) {
      try {
        const el = messagesEndRef.current;
        if (el) {
          if (typeof el.scrollIntoView === 'function') {
            el.scrollIntoView();
          } else {
            // fallback: direct container scrolling
            const parent = el.parentElement;
            if (parent) {
              parent.scrollTop = parent.scrollHeight;
            }
          }
        }
      } catch (err) {
        console.warn('Scroll failed:', err);
      }
      prevLastMessageIdRef.current = lastMessageId;
    }
  }, [lastMessageId, initialLoading]);

  // Load earlier pagination
  const loadEarlier = () => {
    if (messages.length === 0 || loadingEarlier) return;
    setLoadingEarlier(true);

    const oldestMsg = messages[0];
    const before = oldestMsg.created_at;

    fetch(`/api/messages?code=${code}&before=${encodeURIComponent(before)}`)
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Failed to load older messages');
      })
      .then((data) => {
        if (data.messages && data.messages.length > 0) {
          setMessages((prev) => [...data.messages, ...prev]);
          if (data.messages.length < 100) {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }
      })
      .catch((error) => {
        console.error('Failed to load older messages:', error);
      })
      .finally(() => {
        setLoadingEarlier(false);
      });
  };

  if (initialLoading) {
    return <div className="py-8 text-base text-[#111]">Loading...</div>;
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      {hasMore && (
        <button
          onClick={loadEarlier}
          disabled={loadingEarlier}
          className="w-full h-12 text-center text-base text-[#1a3a6b] underline cursor-pointer active:bg-[#f0f0f0]"
        >
          {loadingEarlier ? 'Loading...' : 'Load earlier'}
        </button>
      )}

      {messages.length === 0 ? (
        <div className="py-8 text-center text-base text-[#666] italic">
          No messages yet. Say hello!
        </div>
      ) : (
        <div className="flex flex-col gap-4 mt-2">
          {messages.map((message) => {
            const isSender = message.uid === currentUid;
            const initials = getInitials(message.display_name);
            const isExpanded = !!expandedMessages[message.id];
            const isLengthy = message.body.length > 300;

            const toggleExpand = () => {
              setExpandedMessages((prev) => ({
                ...prev,
                [message.id]: !prev[message.id],
              }));
            };

            const displayText = isLengthy && !isExpanded
              ? message.body.substring(0, 300) + '...'
              : message.body;

            if (isSender) {
              return (
                <div key={message.id} className="flex justify-end items-start gap-2 w-full">
                  <div className="flex flex-col items-end max-w-[75%]">
                    <div className="p-3 border border-[#1a3a6b] bg-white rounded-lg text-left text-base text-[#111] leading-relaxed break-words">
                      <span className="font-bold block text-base mb-1 text-[#1a3a6b]">Me</span>
                      <div className="whitespace-pre-wrap">{displayText}</div>
                      {isLengthy && (
                        <button
                          type="button"
                          onClick={toggleExpand}
                          className="text-[#1a3a6b] underline font-bold mt-1 text-base min-h-12 flex items-center cursor-pointer active:bg-[#f0f0f0]"
                        >
                          {isExpanded ? 'Read less' : 'Read more'}
                        </button>
                      )}
                      {message.attachment_url && (
                        <div className="mt-2 p-2 border border-[#333] bg-[#f0f0f0] inline-block text-left text-base max-w-full">
                          📎{' '}
                          <a
                            href={message.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-[#1a3a6b] font-medium break-all"
                          >
                            {message.attachment_name || 'View Attachment'}
                          </a>
                        </div>
                      )}
                      <div className="text-right text-base text-[#666] mt-1">
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#1a3a6b] text-white flex items-center justify-center font-bold text-base shrink-0 select-none">
                    {initials}
                  </div>
                </div>
              );
            } else {
              return (
                <div key={message.id} className="flex justify-start items-start gap-2 w-full">
                  <div className="w-10 h-10 rounded-full bg-[#333] text-white flex items-center justify-center font-bold text-base shrink-0 select-none">
                    {initials}
                  </div>
                  <div className="flex flex-col items-start max-w-[75%]">
                    <div className="p-3 bg-[#f0f0f0] border border-[#e0e0e0] rounded-lg text-left text-base text-[#111] leading-relaxed break-words">
                      <span className="font-bold block text-base mb-1 text-[#333]">
                        {message.display_name}
                      </span>
                      <div className="whitespace-pre-wrap">{displayText}</div>
                      {isLengthy && (
                        <button
                          type="button"
                          onClick={toggleExpand}
                          className="text-[#1a3a6b] underline font-bold mt-1 text-base min-h-12 flex items-center cursor-pointer active:bg-[#e0e0e0]"
                        >
                          {isExpanded ? 'Read less' : 'Read more'}
                        </button>
                      )}
                      {message.attachment_url && (
                        <div className="mt-2 p-2 border border-[#333] bg-white inline-block text-left text-base max-w-full">
                          📎{' '}
                          <a
                            href={message.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-[#1a3a6b] font-medium break-all"
                          >
                            {message.attachment_name || 'View Attachment'}
                          </a>
                        </div>
                      )}
                      <div className="text-right text-base text-[#666] mt-1">
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
