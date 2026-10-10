import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type {
  PlayerPresence,
  PublicGameState,
  SecretWordPayload,
  RoomStateSnapshot,
  PlayerAction,
} from './types.js';
import { toPublicGameState } from './types.js';
import type { GameState, GameConfig, WordPair } from '../../core/types.js';
import {
  createInitialGame,
  assignRolesAndWords,
  startDescribing,
  nextTurn,
  castVote,
  tallyVotes,
  submitMrWhiteGuess,
  proceedToNextRound,
} from '../../core/game.js';
import { getRandomWordPair } from '../../core/wordBank.js';

export interface LocalPlayerInfo {
  id: string;
  name: string;
  avatar?: string;
}

export class SpyRoomController {
  private roomCode: string = '';
  private isConnected: boolean = false;
  private isHost: boolean = false;
  private presenceList: PlayerPresence[] = [];
  private publicGameState: PublicGameState | null = null;
  private mySecret: SecretWordPayload | null = null;
  private error: string | null = null;

  // Authoritative Game Engine State (Chỉ duy trì trên client Host)
  private rawGameState: GameState | null = null;

  // Grace Period timer
  private graceTimer: ReturnType<typeof setInterval> | null = null;
  private hostGraceSecondsRemaining: number = 0;
  private isPausedForHostReconnect: boolean = false;

  private publicChannel: RealtimeChannel | null = null;
  private privateChannel: RealtimeChannel | null = null;

  private listeners: Set<() => void> = new Set();
  private cachedSnapshot: RoomStateSnapshot;

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly localPlayer: LocalPlayerInfo
  ) {
    this.cachedSnapshot = this.buildSnapshot();
  }

  /**
   * Đăng ký Observer subscriber theo chuẩn useSyncExternalStore của React.
   */
  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Lấy snapshot bất biến của trạng thái phòng hiện tại.
   */
  public getSnapshot = (): RoomStateSnapshot => {
    return this.cachedSnapshot;
  };

  private notify() {
    this.cachedSnapshot = this.buildSnapshot();
    for (const listener of this.listeners) {
      listener();
    }
  }

  private buildSnapshot(): RoomStateSnapshot {
    return {
      roomCode: this.roomCode,
      localPlayerId: this.localPlayer.id,
      localPlayerName: this.localPlayer.name,
      isHost: this.isHost,
      isConnected: this.isConnected,
      presenceList: [...this.presenceList],
      publicGameState: this.publicGameState ? { ...this.publicGameState } : null,
      mySecret: this.mySecret ? { ...this.mySecret } : null,
      error: this.error,
    };
  }

  /**
   * Tham gia phòng chơi thông qua Room Code.
   */
  public async joinRoom(roomCode: string, joinedAt?: number): Promise<void> {
    try {
      this.roomCode = roomCode;
      const effectiveJoinedAt = joinedAt ?? Date.now();

      // Khởi tạo Kênh Công Khai: game_room:<roomCode>
      this.publicChannel = this.supabase.channel(`game_room:${roomCode}`);

      // Khởi tạo Kênh Cá Nhân: game_room:<roomCode>:<userId> (Zero-Knowledge)
      this.privateChannel = this.supabase.channel(
        `game_room:${roomCode}:${this.localPlayer.id}`
      );

      // Lắng nghe Presence trên Kênh Công Khai
      this.publicChannel.on('presence', { event: 'sync' }, () => {
        this.handlePresenceSync();
      });

      // Lắng nghe Broadcast SYNC_STATE trên Kênh Công Khai
      this.publicChannel.on(
        'broadcast',
        { event: 'SYNC_STATE' },
        (payload: { payload?: { state: PublicGameState } }) => {
          if (payload?.payload?.state) {
            this.publicGameState = payload.payload.state;
            if (!this.publicGameState.isPausedForHostReconnect) {
              if (this.graceTimer) {
                clearInterval(this.graceTimer);
                this.graceTimer = null;
              }
              this.hostGraceSecondsRemaining = 0;
              this.isPausedForHostReconnect = false;
            }
            this.notify();
          }
        }
      );

      // Lắng nghe PLAYER_ACTION trên Kênh Công Khai (dành cho Host xử lý)
      this.publicChannel.on(
        'broadcast',
        { event: 'PLAYER_ACTION' },
        (payload: { payload?: { action: PlayerAction } }) => {
          if (this.isHost && payload?.payload?.action) {
            this.handlePlayerAction(payload.payload.action);
          }
        }
      );

      // Lắng nghe ASSIGN_SECRET_WORD trên Kênh Cá Nhân (Zero-Knowledge)
      this.privateChannel.on(
        'broadcast',
        { event: 'ASSIGN_SECRET_WORD' },
        (payload: { payload?: SecretWordPayload }) => {
          if (payload?.payload) {
            this.mySecret = payload.payload;
            this.notify();
          }
        }
      );

      // Subscribe cả hai kênh
      this.publicChannel.subscribe();
      this.privateChannel.subscribe();

      // Track Presence bản thân lên Kênh Công Khai
      await this.publicChannel.track({
        id: this.localPlayer.id,
        name: this.localPlayer.name,
        avatar: this.localPlayer.avatar ?? 'avatar_default',
        isHost: false, // Sẽ được tính lại trong handlePresenceSync
        isReady: true,
        joinedAt: effectiveJoinedAt,
        isAlive: true,
      });

      this.isConnected = true;
      this.error = null;
      this.handlePresenceSync();
      this.notify();
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
      this.notify();
    }
  }

  /**
   * Rời khỏi phòng chơi và dọn dẹp kết nối mạng.
   */
  public async leaveRoom(): Promise<void> {
    if (this.graceTimer) {
      clearInterval(this.graceTimer);
      this.graceTimer = null;
    }

    if (this.publicChannel) {
      await this.publicChannel.untrack();
      await this.publicChannel.unsubscribe();
      this.publicChannel = null;
    }

    if (this.privateChannel) {
      await this.privateChannel.unsubscribe();
      this.privateChannel = null;
    }

    this.roomCode = '';
    this.isConnected = false;
    this.isHost = false;
    this.presenceList = [];
    this.publicGameState = null;
    this.mySecret = null;
    this.rawGameState = null;
    this.error = null;

    this.notify();
  }

  private handlePresenceSync() {
    if (!this.publicChannel) return;

    const presenceMap = this.publicChannel.presenceState();
    const rawPresences: PlayerPresence[] = [];

    for (const key of Object.keys(presenceMap)) {
      const entries = presenceMap[key];
      if (entries && entries.length > 0) {
        const item = entries[0] as unknown as PlayerPresence;
        rawPresences.push(item);
      }
    }

    // Sắp xếp người tham gia theo thời gian tham gia (joinedAt) tăng dần (FIFO)
    rawPresences.sort((a, b) => a.joinedAt - b.joinedAt);

    const previousHostId = this.presenceList.find((p) => p.isHost)?.id;
    const newHostId = rawPresences[0]?.id;

    // Kiểm tra xem Host cũ có vừa rời khỏi phòng không
    const hostLeft = previousHostId && !rawPresences.some((p) => p.id === previousHostId);

    // Cập nhật danh sách presence mới
    this.presenceList = rawPresences.map((p) => ({
      ...p,
      isHost: p.id === newHostId,
    }));

    // Cập nhật quyền Host của bản thân
    this.isHost = newHostId === this.localPlayer.id;

    // Xử lý khi Host rời phòng
    if (hostLeft) {
      const isGameActive =
        this.publicGameState &&
        this.publicGameState.phase !== 'LOBBY' &&
        this.publicGameState.phase !== 'GAME_OVER';

      if (isGameActive) {
        // Trong ACTIVE GAME: bật Grace Period 30s
        this.isPausedForHostReconnect = true;
        this.hostGraceSecondsRemaining = 30;
        this.startGraceTimer();

        if (this.publicGameState) {
          this.publicGameState = {
            ...this.publicGameState,
            isPausedForHostReconnect: true,
            hostReconnectSecondsRemaining: 30,
          };
        }
      }
    }

    this.notify();
  }

  private startGraceTimer() {
    if (this.graceTimer) {
      clearInterval(this.graceTimer);
    }
    this.graceTimer = setInterval(() => {
      if (this.hostGraceSecondsRemaining > 0) {
        this.hostGraceSecondsRemaining--;
        if (this.publicGameState) {
          this.publicGameState = {
            ...this.publicGameState,
            hostReconnectSecondsRemaining: this.hostGraceSecondsRemaining,
          };
          this.notify();
        }
      } else {
        this.triggerHostReconnectTimeout();
      }
    }, 1000);
  }

  /**
   * Kích hoạt xử lý khi hết hạn 30s chờ Host reconnect: Hủy trận về LOBBY và chuyển quyền Host.
   */
  public triggerHostReconnectTimeout() {
    if (this.graceTimer) {
      clearInterval(this.graceTimer);
      this.graceTimer = null;
    }
    this.isPausedForHostReconnect = false;
    this.hostGraceSecondsRemaining = 0;

    // Chuyển về phase LOBBY
    if (this.publicGameState) {
      this.publicGameState = {
        ...this.publicGameState,
        phase: 'LOBBY',
        isPausedForHostReconnect: false,
        hostReconnectSecondsRemaining: 0,
      };
    }

    // Người còn lại có joinedAt sớm nhất là Host mới
    const sorted = [...this.presenceList].sort((a, b) => a.joinedAt - b.joinedAt);
    const newHostId = sorted[0]?.id;
    this.isHost = newHostId === this.localPlayer.id;

    this.notify();
  }

  /**
   * Lấy trạng thái authoritative của Host (để sao lưu phục hồi khi mất mạng).
   */
  public getRawGameState(): GameState | null {
    return this.rawGameState ? { ...this.rawGameState } : null;
  }

  /**
   * Host phục hồi trận đấu sau khi reconnect trong vòng 30s.
   */
  public async resumeMatchAfterReconnect(savedState?: GameState): Promise<void> {
    if (savedState) {
      this.rawGameState = savedState;
    }
    this.isPausedForHostReconnect = false;
    this.hostGraceSecondsRemaining = 0;
    if (this.graceTimer) {
      clearInterval(this.graceTimer);
      this.graceTimer = null;
    }

    if (this.rawGameState) {
      this.publicGameState = toPublicGameState(
        this.rawGameState,
        this.presenceList,
        false,
        0
      );
    } else if (this.publicGameState) {
      this.publicGameState = {
        ...this.publicGameState,
        isPausedForHostReconnect: false,
        hostReconnectSecondsRemaining: 0,
      };
    }

    if (this.publicChannel && this.publicGameState) {
      await this.publicChannel.send({
        type: 'broadcast',
        event: 'SYNC_STATE',
        payload: { state: this.publicGameState } as unknown as Record<string, unknown>,
      });
    }

    this.notify();
  }


  /**
   * Host bắt đầu ván đấu: chia vai, phát từ khóa bí mật qua Kênh Cá Nhân, và broadcast PublicGameState.
   */
  public async startGame(
    config: GameConfig,
    customPair?: WordPair,
    customPack?: WordPair[]
  ): Promise<void> {
    if (!this.isHost) {
      throw new Error('Chỉ Host mới có quyền bắt đầu ván đấu.');
    }

    const players = this.presenceList.map((p) => ({ id: p.id, name: p.name }));
    const initialGame = createInitialGame(this.roomCode, players);
    
    let wordPair: WordPair;
    if (customPair) {
      wordPair = customPair;
    } else if (customPack && customPack.length > 0) {
      wordPair = getRandomWordPair(customPack);
    } else {
      wordPair = getRandomWordPair();
    }

    // Gán vai trò và từ khóa bí mật
    this.rawGameState = assignRolesAndWords(initialGame, config, wordPair);

    // Chuyển sang phase DESCRIBING ngay sau khi tạo
    this.rawGameState = startDescribing(this.rawGameState);

    // Phân phát từ khóa bí mật qua Kênh Cá Nhân (Zero-Knowledge)
    for (const p of this.rawGameState.players) {
      const secret: SecretWordPayload = {
        role: p.role,
        word: p.word,
      };

      if (p.id === this.localPlayer.id) {
        this.mySecret = secret;
      } else {
        // Gửi qua kênh cá nhân game_room:CODE:userId
        const targetPrivateChannel = this.supabase.channel(
          `game_room:${this.roomCode}:${p.id}`
        );
        await targetPrivateChannel.send({
          type: 'broadcast',
          event: 'ASSIGN_SECRET_WORD',
          payload: secret as unknown as Record<string, unknown>,
        });
      }
    }

    // Broadcast PublicGameState đã lọc sạch thông tin mật lên Kênh Công Khai
    await this.broadcastPublicState();
    this.notify();
  }

  /**
   * Gửi PublicGameState lên Kênh Công Khai cho toàn bộ người chơi.
   */
  private async broadcastPublicState(): Promise<void> {
    if (!this.rawGameState || !this.publicChannel) return;

    this.publicGameState = toPublicGameState(
      this.rawGameState,
      this.presenceList,
      this.isPausedForHostReconnect,
      this.hostGraceSecondsRemaining
    );

    await this.publicChannel.send({
      type: 'broadcast',
      event: 'SYNC_STATE',
      payload: { state: this.publicGameState } as unknown as Record<string, unknown>,
    });
  }

  /**
   * Chuyển lượt mô tả tiếp theo.
   */
  public async nextTurn(): Promise<void> {
    if (this.isHost) {
      await this.handlePlayerAction({
        type: 'NEXT_DESCRIBE',
        playerId: this.localPlayer.id,
      });
    } else if (this.publicChannel) {
      await this.publicChannel.send({
        type: 'broadcast',
        event: 'PLAYER_ACTION',
        payload: {
          action: {
            type: 'NEXT_DESCRIBE',
            playerId: this.localPlayer.id,
          },
        } as unknown as Record<string, unknown>,
      });
    }
  }

  /**
   * Bỏ phiếu bầu cho một người chơi.
   */
  public async castVote(targetId: string): Promise<void> {
    if (this.isHost) {
      await this.handlePlayerAction({
        type: 'SUBMIT_VOTE',
        voterId: this.localPlayer.id,
        targetId,
      });
    } else if (this.publicChannel) {
      await this.publicChannel.send({
        type: 'broadcast',
        event: 'PLAYER_ACTION',
        payload: {
          action: {
            type: 'SUBMIT_VOTE',
            voterId: this.localPlayer.id,
            targetId,
          },
        } as unknown as Record<string, unknown>,
      });
    }
  }

  /**
   * Mr. White submit từ đoán.
   */
  public async submitMrWhiteGuess(guess: string): Promise<void> {
    if (this.isHost) {
      await this.handlePlayerAction({
        type: 'MR_WHITE_GUESS',
        playerId: this.localPlayer.id,
        guess,
      });
    } else if (this.publicChannel) {
      await this.publicChannel.send({
        type: 'broadcast',
        event: 'PLAYER_ACTION',
        payload: {
          action: {
            type: 'MR_WHITE_GUESS',
            playerId: this.localPlayer.id,
            guess,
          },
        } as unknown as Record<string, unknown>,
      });
    }
  }

  /**
   * Chuyển sang round mô tả tiếp theo.
   */
  public async proceedToNextRound(): Promise<void> {
    if (this.isHost) {
      await this.handlePlayerAction({
        type: 'PROCEED_ROUND',
        playerId: this.localPlayer.id,
      });
    } else if (this.publicChannel) {
      await this.publicChannel.send({
        type: 'broadcast',
        event: 'PLAYER_ACTION',
        payload: {
          action: {
            type: 'PROCEED_ROUND',
            playerId: this.localPlayer.id,
          },
        } as unknown as Record<string, unknown>,
      });
    }
  }

  /**
   * Host xử lý các action từ peers.
   */
  public async handlePlayerAction(action: PlayerAction): Promise<void> {
    if (!this.isHost || !this.rawGameState) return;

    try {
      switch (action.type) {
        case 'NEXT_DESCRIBE': {
          const currentDescriber =
            this.rawGameState.players[this.rawGameState.currentDescriberIndex];
          // Chỉ người đang có lượt mới được gọi nextTurn
          if (currentDescriber?.id !== action.playerId) {
            return;
          }
          const result = nextTurn(this.rawGameState);
          this.rawGameState = result.newState;
          break;
        }

        case 'SUBMIT_VOTE': {
          if (this.rawGameState.phase !== 'VOTING') return;
          this.rawGameState = castVote(
            this.rawGameState,
            action.voterId,
            action.targetId
          );

          // Nếu tất cả người chơi còn sống đã vote -> tự động tallyVotes
          const alivePlayers = this.rawGameState.players.filter((p) => p.isAlive);
          const allVoted = alivePlayers.every((p) => p.hasVoted);
          if (allVoted) {
            const tallyResult = tallyVotes(this.rawGameState);
            this.rawGameState = tallyResult.newState;
          }
          break;
        }

        case 'MR_WHITE_GUESS': {
          if (this.rawGameState.phase !== 'MR_WHITE_GUESS') return;
          this.rawGameState = submitMrWhiteGuess(
            this.rawGameState,
            action.playerId,
            action.guess
          );
          break;
        }

        case 'PROCEED_ROUND': {
          if (this.rawGameState.phase !== 'VOTE_RESULT') return;
          this.rawGameState = proceedToNextRound(this.rawGameState);
          break;
        }
      }

      await this.broadcastPublicState();
      this.notify();
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
      this.notify();
    }
  }
}
