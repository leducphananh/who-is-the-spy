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
  private localTrackedPresences = new Map<string, Map<string, Record<string, unknown>>>();
  public recordedBroadcasts: { topic: string; event: string; payload: unknown }[] = [];
  private crossTabChannel: BroadcastChannel | null = null;

  constructor(enableCrossTab: boolean = true) {
    if (enableCrossTab && typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.crossTabChannel = new BroadcastChannel('who_is_the_spy_realtime_hub');
        this.crossTabChannel.onmessage = (event) => {
          const { type, sourceTopic, eventName, payload, senderId, clientId, state, presences } =
            event.data || {};
          if (type === 'broadcast') {
            this._dispatchLocalBroadcast(sourceTopic, eventName, payload, senderId);
          } else if (type === 'presence_track') {
            let topicPresences = this.presenceByTopic.get(sourceTopic);
            if (!topicPresences) {
              topicPresences = new Map();
              this.presenceByTopic.set(sourceTopic, topicPresences);
            }
            topicPresences.set(clientId, [state]);
            this._notifyPresence(sourceTopic);

            // Phản hồi lại danh sách presence do tab này sở hữu cho tab vừa join
            const localMap = this.localTrackedPresences.get(sourceTopic);
            if (localMap && localMap.size > 0 && this.crossTabChannel) {
              const list: { clientId: string; state: Record<string, unknown> }[] = [];
              for (const [cId, s] of localMap.entries()) {
                list.push({ clientId: cId, state: s });
              }
              try {
                this.crossTabChannel.postMessage({
                  type: 'presence_state_sync',
                  sourceTopic,
                  presences: list,
                });
              } catch {
                // Ignored
              }
            }
          } else if (type === 'presence_state_sync') {
            let topicPresences = this.presenceByTopic.get(sourceTopic);
            if (!topicPresences) {
              topicPresences = new Map();
              this.presenceByTopic.set(sourceTopic, topicPresences);
            }
            if (Array.isArray(presences)) {
              for (const item of presences) {
                topicPresences.set(item.clientId, [item.state]);
              }
              this._notifyPresence(sourceTopic);
            }
          } else if (type === 'presence_untrack') {
            const topicPresences = this.presenceByTopic.get(sourceTopic);
            if (topicPresences) {
              topicPresences.delete(clientId);
              this._notifyPresence(sourceTopic);
            }
          } else if (type === 'presence_query') {
            const localMap = this.localTrackedPresences.get(sourceTopic);
            if (localMap && localMap.size > 0 && this.crossTabChannel) {
              const list: { clientId: string; state: Record<string, unknown> }[] = [];
              for (const [cId, s] of localMap.entries()) {
                list.push({ clientId: cId, state: s });
              }
              try {
                this.crossTabChannel.postMessage({
                  type: 'presence_state_sync',
                  sourceTopic,
                  presences: list,
                });
              } catch {
                // Ignored
              }
            }
          }
        };
      } catch {
        this.crossTabChannel = null;
      }
    }
  }

  registerChannel(channel: MockRealtimeChannel) {
    let set = this.channelsByTopic.get(channel.topic);
    if (!set) {
      set = new Set();
      this.channelsByTopic.set(channel.topic, set);
    }
    set.add(channel);

    if (this.crossTabChannel) {
      try {
        this.crossTabChannel.postMessage({
          type: 'presence_query',
          sourceTopic: channel.topic,
        });
      } catch {
        // Ignored
      }
    }
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
    senderClientId?: string
  ) {
    this.recordedBroadcasts.push({ topic: sourceTopic, event, payload });
    this._dispatchLocalBroadcast(sourceTopic, event, payload, senderClientId);

    if (this.crossTabChannel) {
      try {
        this.crossTabChannel.postMessage({
          type: 'broadcast',
          sourceTopic,
          eventName: event,
          payload,
          senderId: senderClientId,
        });
      } catch {
        // Ignored
      }
    }
  }

  private _dispatchLocalBroadcast(
    sourceTopic: string,
    event: string,
    payload: Record<string, unknown>,
    _senderClientId?: string
  ) {
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
    let localMap = this.localTrackedPresences.get(topic);
    if (!localMap) {
      localMap = new Map();
      this.localTrackedPresences.set(topic, localMap);
    }
    localMap.set(clientId, state);

    let topicPresences = this.presenceByTopic.get(topic);
    if (!topicPresences) {
      topicPresences = new Map();
      this.presenceByTopic.set(topic, topicPresences);
    }
    topicPresences.set(clientId, [state]);
    this._notifyPresence(topic);

    if (this.crossTabChannel) {
      try {
        this.crossTabChannel.postMessage({
          type: 'presence_track',
          sourceTopic: topic,
          clientId,
          state,
        });
      } catch {
        // Ignored
      }
    }
  }

  untrackPresence(topic: string, clientId: string) {
    const localMap = this.localTrackedPresences.get(topic);
    if (localMap) {
      localMap.delete(clientId);
    }

    const topicPresences = this.presenceByTopic.get(topic);
    if (topicPresences) {
      topicPresences.delete(clientId);
      this._notifyPresence(topic);

      if (this.crossTabChannel) {
        try {
          this.crossTabChannel.postMessage({
            type: 'presence_untrack',
            sourceTopic: topic,
            clientId,
          });
        } catch {
          // Ignored
        }
      }
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
