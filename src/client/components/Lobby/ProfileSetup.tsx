import React, { useState } from 'react';
import { User, ShieldCheck } from 'lucide-react';

export interface AvatarOption {
  id: string;
  label: string;
  emoji: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'fox', label: 'Cáo Mật Vụ', emoji: '🦊' },
  { id: 'cat', label: 'Mèo Điệp Viên', emoji: '🐱' },
  { id: 'owl', label: 'Cú Thám Tử', emoji: '🦉' },
  { id: 'wolf', label: 'Sói Ẩn Thân', emoji: '🐺' },
  { id: 'panda', label: 'Panda Đặc Nhiệm', emoji: '🐼' },
  { id: 'lion', label: 'Sư Tử Chỉ Huy', emoji: '🦁' },
  { id: 'bunny', label: 'Thỏ Mật Thư', emoji: '🐰' },
  { id: 'frog', label: 'Ếch Gián Điệp', emoji: '🐸' },
];

export interface ProfileSetupProps {
  onSaveProfile: (profile: { name: string; avatar: string }) => void;
  initialProfile?: { name: string; avatar: string } | undefined;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({
  onSaveProfile,
  initialProfile,
}) => {
  const [name, setName] = useState(initialProfile?.name || '');
  const [avatar, setAvatar] = useState(initialProfile?.avatar || 'fox');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Biệt danh cần tối thiểu 2 ký tự.');
      return;
    }
    if (trimmed.length > 16) {
      setError('Biệt danh tối đa 16 ký tự.');
      return;
    }
    setError(null);
    onSaveProfile({ name: trimmed, avatar });
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl flex flex-col gap-6">
      <div className="text-center space-y-1">
        <div className="inline-flex p-3 rounded-2xl bg-amber-400/10 text-amber-400 mb-2 border border-amber-400/20">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Hồ Sơ Mật Vụ
        </h2>
        <p className="text-sm text-slate-400">
          Chọn bí danh và diện mạo trước khi vào phòng
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Chọn Avatar */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Chọn Avatar Điệp Viên
          </label>
          <div className="grid grid-cols-4 gap-3">
            {AVATAR_OPTIONS.map((opt) => {
              const isSelected = avatar === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAvatar(opt.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-2xl transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-amber-400/15 shadow-lg shadow-amber-400/20 scale-105'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                  title={opt.label}
                >
                  <span>{opt.emoji}</span>
                  <span className="text-[10px] mt-1 text-slate-400 truncate max-w-full font-medium">
                    {opt.label.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nhập Nickname */}
        <div className="space-y-2">
          <label
            htmlFor="nickname-input"
            className="text-xs font-semibold text-slate-300 uppercase tracking-wider block"
          >
            Biệt Danh Của Bạn
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <User className="w-5 h-5" />
            </div>
            <input
              id="nickname-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="VD: James Bond, Thám tử Conan..."
              maxLength={16}
              className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-medium text-sm"
            />
          </div>
          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>

        <button
          type="submit"
          className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all"
        >
          Xác Nhận & Tiếp Tục
        </button>
      </form>
    </div>
  );
};
