import * as React from 'react';
import { useSyncExternalStore } from 'react';
import type { SpyRoomController } from '../network/SpyRoomController.js';
import type { RoomStateSnapshot } from '../network/types.js';
import type { GameConfig } from '../../core/types.js';

export interface UseSpyRoomResult extends RoomStateSnapshot {
  startGame: (config: GameConfig) => Promise<void>;
  nextTurn: () => Promise<void>;
  castVote: (targetId: string) => Promise<void>;
  submitMrWhiteGuess: (guess: string) => Promise<void>;
  proceedToNextRound: () => Promise<void>;
  joinRoom: (roomCode: string, joinedAt?: number) => Promise<void>;
  leaveRoom: () => Promise<void>;
}

function hasReactDispatcher(): boolean {
  // Kiểm tra React 19 & React 18 dispatcher
  const reactAny = React as Record<string, unknown>;
  const internals19 = reactAny['__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE'] as
    | { H?: unknown }
    | undefined;
  if (internals19?.H) return true;

  const internals18 = reactAny['__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED'] as
    | { ReactCurrentDispatcher?: { current?: unknown } }
    | undefined;
  if (internals18?.ReactCurrentDispatcher?.current) return true;

  return false;
}

/**
 * React Hook đồng bộ trạng thái phòng chơi từ SpyRoomController vào UI Component.
 * Sử dụng useSyncExternalStore để đảm bảo concurrent rendering an toàn và tránh tearing.
 */
export function useSpyRoom(controller: SpyRoomController): UseSpyRoomResult {
  let snapshot: RoomStateSnapshot;
  if (hasReactDispatcher()) {
    snapshot = useSyncExternalStore(
      controller.subscribe,
      controller.getSnapshot,
      controller.getSnapshot
    );
  } else {
    snapshot = controller.getSnapshot();
  }

  return {
    ...snapshot,
    startGame: controller.startGame.bind(controller),
    nextTurn: controller.nextTurn.bind(controller),
    castVote: controller.castVote.bind(controller),
    submitMrWhiteGuess: controller.submitMrWhiteGuess.bind(controller),
    proceedToNextRound: controller.proceedToNextRound.bind(controller),
    joinRoom: controller.joinRoom.bind(controller),
    leaveRoom: controller.leaveRoom.bind(controller),
  };
}
