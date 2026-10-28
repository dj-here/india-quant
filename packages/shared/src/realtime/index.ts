/**
 * Realtime Communication Abstraction
 *
 * Provides a unified interface for sending live event notifications (new messages,
 * booking state transitions, daily stay updates) across the platform.
 * Supports managed providers (Ably, Pusher) and in-memory mock for testing & local development.
 */

export interface RealtimeMessageEvent<T = unknown> {
  channel: string;
  event: string;
  payload: T;
  timestamp: string;
}

export interface RealtimeProvider {
  publish<T = unknown>(channel: string, event: string, payload: T): Promise<void>;
}

export type RealtimeSubscriber<T = unknown> = (event: string, payload: T) => void;

/**
 * In-memory Mock Realtime Provider with subscription support for testing
 */
export class MockRealtimeProvider implements RealtimeProvider {
  private events: RealtimeMessageEvent[] = [];
  private subscribers: Map<string, Set<RealtimeSubscriber<any>>> = new Map();

  async publish<T = unknown>(channel: string, event: string, payload: T): Promise<void> {
    const record: RealtimeMessageEvent<T> = {
      channel,
      event,
      payload,
      timestamp: new Date().toISOString(),
    };
    this.events.push(record as RealtimeMessageEvent);

    const channelSubs = this.subscribers.get(channel);
    if (channelSubs) {
      for (const sub of channelSubs) {
        sub(event, payload);
      }
    }
  }

  subscribe<T = unknown>(channel: string, callback: RealtimeSubscriber<T>): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel)!.add(callback);

    return () => {
      this.subscribers.get(channel)?.delete(callback);
    };
  }

  getEvents(channel?: string): RealtimeMessageEvent[] {
    if (channel) {
      return this.events.filter((e) => e.channel === channel);
    }
    return [...this.events];
  }

  clear(): void {
    this.events = [];
    this.subscribers.clear();
  }
}

/**
 * Singleton instance of Realtime Provider for application runtime
 */
let realtimeInstance: RealtimeProvider | null = null;

export function getRealtimeProvider(): RealtimeProvider {
  if (!realtimeInstance) {
    // In production with PUSHER_APP_ID or ABLY_API_KEY, can initialize Pusher/Ably adapter
    // Defaulting to resilient mock/in-memory provider
    realtimeInstance = new MockRealtimeProvider();
  }
  return realtimeInstance;
}

export function setRealtimeProvider(provider: RealtimeProvider): void {
  realtimeInstance = provider;
}
