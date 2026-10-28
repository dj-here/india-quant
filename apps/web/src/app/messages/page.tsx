'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Shield,
  Calendar,
  ChevronRight,
  Dog,
  Search,
} from 'lucide-react';

interface ConversationSummary {
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
  otherParty: {
    id: string;
    name: string;
    image?: string;
    role: string;
    headline?: string;
  };
  lastMessage?: {
    id: string;
    text: string;
    hasOffPlatformAttempt: boolean;
    createdAt: string;
    isSender: boolean;
    isRead: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export default function MessagesInboxPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await fetch('/api/conversations');
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations || []);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadConversations();
  }, []);

  const filteredConversations = conversations.filter((c) =>
    c.otherParty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.lastMessage?.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.booking?.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Messages</h1>
          <p className="text-sm text-slate-500">
            Communicate securely with your pet sitters and pet parents.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
          Loading conversations...
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No messages yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            When you request a stay with a sitter or receive inquiries, your conversations will appear here.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
          >
            Find a Verified Sitter
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden">
          {filteredConversations.map((conv) => {
            const hasUnread = conv.unreadCount > 0;
            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className={`p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                  hasUnread ? 'bg-emerald-50/40' : ''
                }`}
              >
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg border border-emerald-200">
                      {conv.otherParty.name.charAt(0)}
                    </div>
                    {hasUnread && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm truncate ${hasUnread ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-800'}`}>
                        {conv.otherParty.name}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {conv.otherParty.role}
                      </span>
                    </div>

                    <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                      {conv.lastMessage?.text || 'No messages exchanged yet'}
                    </p>

                    {conv.booking && (
                      <div className="flex items-center space-x-3 mt-1.5 text-[11px] text-slate-400">
                        <span className="inline-flex items-center font-medium text-slate-600">
                          <Calendar className="h-3 w-3 mr-1 text-slate-400" />
                          {conv.booking.bookingNumber}
                        </span>
                        <span className="font-semibold text-emerald-600">
                          {conv.booking.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-slate-400 flex-shrink-0 ml-4">
                  <span className="text-xs">
                    {new Date(conv.updatedAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
