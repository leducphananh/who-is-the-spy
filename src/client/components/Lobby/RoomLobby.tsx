import React, { useState } from 'react';
import { PlusCircle, LogIn, Edit2, KeyRound } from 'lucide-react';
import { AVATAR_OPTIONS } from './ProfileSetup.js';

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export interface RoomLobbyProps {
  profile: { name: string; avatar: string };
  onCreateRoom: (roomCode: string) => void;
  onJoinRoom: (roomCode: string) => void;
  onEditProfile: () => void;
}

export const RoomLobby: React.FC<RoomLobbyProps> = ({
  profile,
  onCreateRoom,
  onJoinRoom,
  onEditProfile,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  const currentAvatarEmoji =
    AVATAR_OPTIONS.find((a) => a.id === profile.avatar)?.emoji || '🕵️';

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = roomCodeInput.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      setJoinError('Mã phòng bao gồm đúng 6 ký tự.');
      return;
    }
    setJoinError(null);
    onJoinRoom(cleanCode);
  };

  const handleCreateSubmit = () => {
    const newCode = generateRoomCode();
    onCreateRoom(newCode);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl flex flex-col gap-6">
      {/* Header Profile Badge */}
      <div className="flex items-center justify-between p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-2xl border border-slate-700">
            {currentAvatarEmoji}
          </div>
          <div>
            <div className="text-xs text-slate-400">Đang đăng nhập</div>
            <div className="font-bold text-white text-base truncate max-w-[170px]">
              {profile.name}
            </div>
          </div>
        </div>
        <button
          onClick={onEditProfile}
          className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-700/50"
          title="Đổi tên / avatar"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => setTab('create')}
          className={`py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            tab === 'create'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Tạo Phòng
        </button>
        <button
          type="button"
          onClick={() => setTab('join')}
          className={`py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            tab === 'join'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <LogIn className="w-4 h-4" />
          Vào Phòng
        </button>
      </div>

      {/* Tab Nội Dung */}
      {tab === 'create' ? (
        <div className="space-y-4 text-center py-2">
          <p className="text-sm text-slate-300">
            Khởi tạo một phòng chơi mật vụ mới và mời bạn bè tham gia qua mã phòng 6 ký tự.
          </p>
          <button
            onClick={handleCreateSubmit}
            className="w-full py-4 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-base rounded-xl shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all"
          >
            Tạo Phòng Ngay
          </button>
        </div>
      ) : (
        <form onSubmit={handleJoinSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Nhập Mã Phòng (6 ký tự)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => {
                  setRoomCodeInput(e.target.value.toUpperCase());
                  if (joinError) setJoinError(null);
                }}
                maxLength={6}
                placeholder="VD: SPY888"
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono tracking-widest text-lg uppercase placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-center font-bold"
              />
            </div>
            {joinError && <p className="text-xs text-rose-400">{joinError}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-4 px-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-extrabold text-base rounded-xl shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all"
          >
            Tham Gia Phòng
          </button>
        </form>
      )}
    </div>
  );
};
