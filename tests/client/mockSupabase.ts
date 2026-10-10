import type {
  RealtimeChannel,
  SupabaseClient,
  REALTIME_SUBSCRIBE_STATES,
} from '@supabase/supabase-js';

type BroadcastCallback = (payload: {
  event: string;
  type: string;
  payload: Record<string, unknown>;
}) => void;

type PresenceCallback = (payload: {
  key: string;
  currentPresences: Record<string, unknown>[];
  leftPresences?: Record<string, unknown>[];
  newPresences?: Record<string, unknown>[];
}) => void;

export class MockRealtimeHub {
  private channelsByTopic = new Map<string, Set<MockRealtimeChannel>>();
  private presenceByTopic = new Map<string, Map<string, Record<string, unknown>[]>>();
  public recordedBroadcasts: { topic: string; event: string; payload: unknown }[] = [];

  registerChannel(channel: MockRealtimeChannel) {
    let set = this.channelsByTopic.get(channel.topic);
    if (!set) {
      set = new Set();
      this.channelsByTopic.set(channel.topic, set);
    }
    set.add(channel);
  }

  unregisterChannel(channel: MockRealtimeChannel) {
    const set = this.channelsByTopic.get(channel.topic);
    if (set) {
      set.delete(channel);
      if (set.size === 0) {
        this.channelsByTopic.delete(channel.topic);
      }
    }
  }

  broadcast(
    sourceTopic: string,
    event: string,
    payload: Record<string, unknown>,
    _senderClientId?: string
  ) {
    this.recordedBroadcasts.push({ topic: sourceTopic, event, payload });
    const set = this.channelsByTopic.get(sourceTopic);
    if (!set) return;

    for (const channel of set) {
      channel._triggerBroadcast(event, payload);
    }
  }

  trackPresence(
    topic: string,
    clientId: string,
    state: Record<string, unknown>
  ) {
    let topicPresences = this.presenceByTopic.get(topic);
    if (!topicPresences) {
      topicPresences = new Map();
      this.presenceByTopic.set(topic, topicPresences);
    }
    topicPresences.set(clientId, [state]);
    this._notifyPresence(topic);
  }

  untrackPresence(topic: string, clientId: string) {
    const topicPresences = this.presenceByTopic.get(topic);
    if (topicPresences) {
      topicPresences.delete(clientId);
      this._notifyPresence(topic);
    }
  }

  getPresenceState(topic: string): Record<string, Record<string, unknown>[]> {
    const topicPresences = this.presenceByTopic.get(topic);
    if (!topicPresences) return {};
    const result: Record<string, Record<string, unknown>[]> = {};
    for (const [key, val] of topicPresences.entries()) {
      result[key] = val;
    }
    return result;
  }

  private _notifyPresence(topic: string) {
    const set = this.channelsByTopic.get(topic);
    if (!set) return;

    for (const channel of set) {
      channel._triggerPresenceSync();
    }
  }
}

export class MockRealtimeChannel {
  private broadcastListeners = new Map<string, BroadcastCallback[]>();
  private presenceListeners = new Map<string, PresenceCallback[]>();
  public isSubscribed = false;

  constructor(
    public readonly topic: string,
    private readonly hub: MockRealtimeHub,
    public readonly clientId: string
  ) {}

  on(
    type: 'broadcast',
    filter: { event: string },
    callback: BroadcastCallback
  ): this;
  on(
    type: 'presence',
    filter: { event: 'sync' | 'join' | 'leave' },
    callback: PresenceCallback
  ): this;
  on(
    type: string,
    filter: { event: string },
    callback: BroadcastCallback | PresenceCallback
  ): this {
    if (type === 'broadcast') {
      const list = this.broadcastListeners.get(filter.event) ?? [];
      list.push(callback as BroadcastCallback);
      this.broadcastListeners.set(filter.event, list);
    } else if (type === 'presence') {
      const list = this.presenceListeners.get(filter.event) ?? [];
      list.push(callback as PresenceCallback);
      this.presenceListeners.set(filter.event, list);
    }
    return this;
  }

  subscribe(
    callback?: (status: `${REALTIME_SUBSCRIBE_STATES}`, err?: Error) => void
  ): this {
    this.isSubscribed = true;
    this.hub.registerChannel(this);
    if (callback) {
      callback('SUBSCRIBED');
    }
    return this;
  }

  async unsubscribe(): Promise<'ok'> {
    this.isSubscribed = false;
    this.hub.untrackPresence(this.topic, this.clientId);
    this.hub.unregisterChannel(this);
    return 'ok';
  }

  async send(params: {
    type: 'broadcast';
    event: string;
    payload: Record<string, unknown>;
  }): Promise<'ok'> {
    this.hub.broadcast(this.topic, params.event, params.payload, this.clientId);
    return 'ok';
  }

  async track(state: Record<string, unknown>): Promise<'ok'> {
    this.hub.trackPresence(this.topic, this.clientId, state);
    return 'ok';
  }

  async untrack(): Promise<'ok'> {
    this.hub.untrackPresence(this.topic, this.clientId);
    return 'ok';
  }

  presenceState<T extends Record<string, unknown> = Record<string, unknown>>(): Record<
    string,
    T[]
  > {
    return this.hub.getPresenceState(this.topic) as Record<string, T[]>;
  }

  _triggerBroadcast(event: string, payload: Record<string, unknown>) {
    const listeners = this.broadcastListeners.get(event) ?? [];
    for (const listener of listeners) {
      listener({ event, type: 'broadcast', payload });
    }
  }

  _triggerPresenceSync() {
    const syncListeners = this.presenceListeners.get('sync') ?? [];
    for (const listener of syncListeners) {
      listener({
        key: this.clientId,
        currentPresences: [],
      });
    }
  }
}

export function createMockSupabaseClient(
  hub: MockRealtimeHub,
  clientId: string
): SupabaseClient {
  const channels = new Map<string, MockRealtimeChannel>();

  const client = {
    channel(topic: string) {
      let chan = channels.get(topic);
      if (!chan) {
        chan = new MockRealtimeChannel(topic, hub, clientId);
        channels.set(topic, chan);
      }
      return chan as unknown as RealtimeChannel;
    },
    removeChannel(chan: RealtimeChannel) {
      const topic = (chan as unknown as MockRealtimeChannel).topic;
      channels.delete(topic);
      return Promise.resolve('ok');
    },
  };

  return client as unknown as SupabaseClient;
}
