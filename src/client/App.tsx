import React, { useState, useMemo } from 'react';
import { Shield, Radio, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { getSupabaseClient, isUsingRealSupabase } from './network/supabaseClient.js';
import { SpyRoomController, type LocalPlayerInfo } from './network/SpyRoomController.js';
import { useSpyRoom } from './hooks/useSpyRoom.js';
import { soundEffects } from './lib/soundEffects.js';
import { ProfileSetup } from './components/Lobby/ProfileSetup.js';
import { RoomLobby } from './components/Lobby/RoomLobby.js';
import { WaitingRoom } from './components/Lobby/WaitingRoom.js';
import { SecretWordCard } from './components/Game/SecretWordCard.js';
import { DescribingView } from './components/Game/DescribingView.js';
import { VotingView } from './components/Game/VotingView.js';
import { VoteResultModal } from './components/Game/VoteResultModal.js';
import { MrWhiteModal } from './components/Game/MrWhiteModal.js';
import { GameOverModal } from './components/Game/GameOverModal.js';
import { HostReconnectOverlay } from './components/Game/HostReconnectOverlay.js';
import { WordPackModal, type CustomWordPack } from './components/Lobby/WordPackModal.js';
import type { GameConfig, WordPair } from '../core/types.js';

interface UserProfile {
  name: string;
  avatar: string;
}

export const App: React.FC = () => {
  // Persistent User ID
  const [userId] = useState<string>(() => {
    if (typeof localStorage !== 'undefined') {
      const storedId = localStorage.getItem('spy_user_id');
      if (storedId) return storedId;
      const newId = `usr_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('spy_user_id', newId);
      return newId;
    }
    return `usr_${Math.random().toString(36).substring(2, 9)}`;
  });

  // Persistent User Profile
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('spy_user_profile');
      if (stored) {
        try {
          return JSON.parse(stored) as UserProfile;
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => soundEffects.isSoundEnabled());
  const [isWordPackModalOpen, setIsWordPackModalOpen] = useState<boolean>(false);
  const [activePack, setActivePack] = useState<CustomWordPack | null>(null);
  const [quickCustomWordPair, setQuickCustomWordPair] = useState<WordPair | null>(null);
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    spyCount: 1,
    hasMrWhite: false,
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEffects.setSoundEnabled(next);
  };

  // Supabase Client and Controller
  const supabase = useMemo(() => getSupabaseClient(userId), [userId]);

  const localPlayerInfo = useMemo<LocalPlayerInfo>(() => {
    return {
      id: userId,
      name: profile?.name || 'Mật Vụ',
      avatar: profile?.avatar || 'fox',
    };
  }, [userId, profile]);

  const controller = useMemo(() => {
    return new SpyRoomController(supabase, localPlayerInfo);
  }, [supabase, localPlayerInfo]);

  const roomState = useSpyRoom(controller);

  const handleSaveProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setIsEditingProfile(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('spy_user_profile', JSON.stringify(newProfile));
    }
  };

  const handleCreateRoom = async (code: string) => {
    await roomState.joinRoom(code);
  };

  const handleJoinRoom = async (code: string) => {
    await roomState.joinRoom(code);
  };

  const handleLeaveRoom = async () => {
    await roomState.leaveRoom();
  };

  const isRealCloud = isUsingRealSupabase();

  // Find current user player state in publicGameState
  const myPlayer = roomState.publicGameState?.players.find((p) => p.id === userId);
  const mrWhitePlayer = roomState.publicGameState?.players.find(
    (p) => p.id === roomState.publicGameState?.lastVoteResult?.eliminatedPlayerId
  );

  return (
    <div className="min-h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-start font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      <div className="w-full max-w-md min-h-[100dvh] flex flex-col p-3 sm:p-4 pb-6">
        {/* Brand Header */}
        <header className="flex items-center justify-between py-3 mb-2 border-b border-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
              <Shield className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-wide text-slate-100 flex items-center gap-1.5">
                <span>AI LÀ GIÁN ĐIỆP</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">WHO IS THE SPY?</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSound}
              aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-slate-700 transition-all shadow-sm"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
            <span
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                isRealCloud
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                  : 'bg-cyan-950/60 text-cyan-400 border-cyan-800'
              }`}
            >
              <Radio className="w-3 h-3 animate-pulse" />
              <span>{isRealCloud ? 'Supabase Cloud' : 'Multi-Tab Hub'}</span>
            </span>
          </div>
        </header>

        {/* Error notification */}
        {roomState.error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="flex-1">{roomState.error}</span>
          </div>
        )}

        {/* Main Stage View Dispatcher */}
        <main className="flex-1 flex flex-col justify-start">
          {!profile || isEditingProfile ? (
            <ProfileSetup
              onSaveProfile={handleSaveProfile}
              initialProfile={profile || undefined}
            />
          ) : !roomState.roomCode ? (
            <RoomLobby
              profile={profile}
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              onEditProfile={() => setIsEditingProfile(true)}
            />
          ) : (
            <>
              {/* Host Reconnect Overlay */}
              {roomState.publicGameState?.isPausedForHostReconnect && (
                <HostReconnectOverlay
                  secondsRemaining={roomState.publicGameState.hostReconnectSecondsRemaining}
                  isOldHost={false}
                />
              )}

              {/* Phase Switcher */}
              {(!roomState.publicGameState || roomState.publicGameState.phase === 'LOBBY') && (
                <WaitingRoom
                  roomCode={roomState.roomCode}
                  myUserId={userId}
                  isHost={roomState.isHost}
                  players={roomState.presenceList}
                  config={gameConfig}
                  onUpdateConfig={setGameConfig}
                  onStartGame={() =>
                    roomState.startGame(
                      gameConfig,
                      quickCustomWordPair ?? undefined,
                      activePack?.pairs
                    )
                  }
                  onLeaveRoom={handleLeaveRoom}
                  quickWordPair={quickCustomWordPair}
                  onQuickWordPairChange={setQuickCustomWordPair}
                  activePackName={activePack?.name}
                  onOpenWordPackModal={() => setIsWordPackModalOpen(true)}
                />
              )}

              {roomState.publicGameState?.phase === 'ROLE_REVEAL' && (
                <SecretWordCard secret={roomState.mySecret} />
              )}

              {roomState.publicGameState?.phase === 'DESCRIBING' && (
                <DescribingView
                  roundNumber={roomState.publicGameState.roundNumber}
                  currentDescriberIndex={roomState.publicGameState.currentDescriberIndex}
                  players={roomState.publicGameState.players}
                  myUserId={userId}
                  mySecret={roomState.mySecret}
                  onNextDescribe={roomState.nextTurn}
                />
              )}

              {roomState.publicGameState?.phase === 'VOTING' && (
                <VotingView
                  players={roomState.publicGameState.players}
                  myUserId={userId}
                  hasVoted={myPlayer?.hasVoted ?? false}
                  myVoteTargetId={myPlayer?.voteTargetId}
                  onCastVote={roomState.castVote}
                />
              )}

              {roomState.publicGameState?.phase === 'VOTE_RESULT' &&
                roomState.publicGameState.lastVoteResult && (
                  <VoteResultModal
                    result={roomState.publicGameState.lastVoteResult}
                    players={roomState.publicGameState.players}
                    isHost={roomState.isHost}
                    onProceed={roomState.proceedToNextRound}
                  />
                )}

              {roomState.publicGameState?.phase === 'MR_WHITE_GUESS' && (
                <MrWhiteModal
                  isMrWhite={roomState.mySecret?.role === 'MR_WHITE'}
                  mrWhitePlayerName={mrWhitePlayer?.name || 'Mr. White'}
                  onSubmitGuess={roomState.submitMrWhiteGuess}
                />
              )}

              {roomState.publicGameState?.phase === 'GAME_OVER' && (
                <GameOverModal
                  winner={roomState.publicGameState.winner}
                  players={roomState.publicGameState.players}
                  isHost={roomState.isHost}
                  onPlayAgain={() =>
                    roomState.startGame(
                      gameConfig,
                      quickCustomWordPair ?? undefined,
                      activePack?.pairs
                    )
                  }
                />
              )}
            </>
          )}
        </main>

        {/* Word Pack Modal */}
        <WordPackModal
          isOpen={isWordPackModalOpen}
          onClose={() => setIsWordPackModalOpen(false)}
          onSelectActivePack={setActivePack}
          activePackId={activePack?.id || null}
        />
      </div>
    </div>
  );
};
