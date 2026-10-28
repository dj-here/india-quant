'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  Shield,
  ShieldAlert,
  Calendar,
  ExternalLink,
  CheckCheck,
  Clock,
  Dog,
} from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderImage?: string;
  text: string;
  hasOffPlatformAttempt: boolean;
  createdAt: string;
  isSender: boolean;
  isRead: boolean;
}

interface ConversationData {
  id: string;
  bookingId?: string;
  booking?: {
    id: string;
    bookingNumber: string;
    status: string;
    startDate: string;
    endDate: string;
    serviceType: string;
    bookingPets?: Array<{ pet: { name: string; species: string } }>;
  };
  isBookingConfirmed: boolean;
  otherParty: {
    id: string;
    name: string;
    image?: string;
    role: string;
    headline?: string;
    city?: string;
    state?: string;
  };
}

export default function ConversationPage({
  params,
}: {
  params: { conversationId: string };
}) {
  const router = useRouter();
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversationAndMessages = async () => {
    try {
      const [convRes, msgRes] = await Promise.all([
        fetch(`/api/conversations/${params.conversationId}`),
        fetch(`/api/conversations/${params.conversationId}/messages`),
      ]);

      if (!convRes.ok || !msgRes.ok) {
        if (convRes.status === 404) {
          router.push('/messages');
          return;
        }
        throw new Error('Failed to load conversation');
      }

      const convData = await convRes.json();
      const msgData = await msgRes.json();

      setConversation(convData.conversation);
      setMessages(msgData.messages || []);
      setErrorMessage(null);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error loading chat');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversationAndMessages();
    // Poll for new messages every 4 seconds
    const interval = setInterval(fetchConversationAndMessages, 4000);
    return () => clearInterval(interval);
  }, [params.conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const res = await fetch(`/api/conversations/${params.conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: messageText }),
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Could not send message. Please retry.');
      setInputText(messageText); // restore unsent text
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        Loading conversation...
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-600 mb-4">Conversation not found.</p>
        <Link href="/messages" className="text-emerald-600 font-semibold hover:underline">
          Return to Inbox
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back button and Header */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/messages"
          className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Inbox
        </Link>

        {conversation.booking && (
          <Link
            href={`/bookings/${conversation.booking.id}`}
            className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200 transition-colors"
          >
            <Calendar className="h-3.5 w-3.5 mr-1" />
            Booking {conversation.booking.bookingNumber} ({conversation.booking.status})
            <ExternalLink className="h-3 w-3 ml-1" />
          </Link>
        )}
      </div>

      {/* Main Chat Box Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[75vh]">
        {/* Counterparty Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg border border-emerald-200">
              {conversation.otherParty.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-slate-900 text-base">
                  {conversation.otherParty.name}
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {conversation.otherParty.role}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {conversation.otherParty.headline ||
                  (conversation.otherParty.city
                    ? `${conversation.otherParty.city}, ${conversation.otherParty.state}`
                    : 'PawStay Member')}
              </p>
            </div>
          </div>

          {conversation.booking?.bookingPets && conversation.booking.bookingPets.length > 0 && (
            <div className="hidden sm:flex items-center text-xs font-medium text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <Dog className="h-4 w-4 mr-1.5 text-emerald-600" />
              For {conversation.booking.bookingPets.map((bp) => bp.pet.name).join(', ')}
            </div>
          )}
        </div>

        {/* Trust & Safety Pre-booking Banner */}
        {!conversation.isBookingConfirmed && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 px-4 flex items-start space-x-3 text-xs text-amber-900">
            <ShieldAlert className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">PawStay Safety Shield Active: </span>
              For your safety and protection under the PawStay Guarantee, phone numbers,
              personal addresses, and off-platform payment links are automatically masked until a booking is accepted and paid.
            </div>
          </div>
        )}

        {/* Message Thread Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
              <Shield className="h-10 w-10 mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Start the conversation</p>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Say hello, ask about pet routines, or coordinate a complimentary meet & greet.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.isSender ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    msg.isSender
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                  {msg.hasOffPlatformAttempt && (
                    <div
                      className={`mt-1.5 pt-1.5 text-[11px] flex items-center border-t ${
                        msg.isSender
                          ? 'border-emerald-500/50 text-emerald-100'
                          : 'border-amber-200 text-amber-700'
                      }`}
                    >
                      <ShieldAlert className="h-3 w-3 mr-1 flex-shrink-0" />
                      Contact info masked by safety filter
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-slate-400 px-1">
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {msg.isSender && (
                    <span>
                      {msg.isRead ? (
                        <CheckCheck className="h-3.5 w-3.5 text-emerald-600 inline" />
                      ) : (
                        <Clock className="h-3 w-3 text-slate-400 inline" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message to your sitter or pet parent..."
            className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-2.5 rounded-xl font-medium transition-colors flex items-center justify-center flex-shrink-0"
            title="Send Message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
