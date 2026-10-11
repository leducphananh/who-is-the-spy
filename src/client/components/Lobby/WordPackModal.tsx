import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, X, CheckCircle2, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import type { WordPair } from '../../../core/types.js';
import { WORD_PAIRS } from '../../../core/wordBank.js';
import { generateCustomWordPair } from '../../lib/geminiWords.js';

export interface CustomWordPack {
  id: string;
  name: string;
  description?: string | undefined;
  createdAt: number;
  pairs: WordPair[];
}

export const CUSTOM_WORD_PACKS_KEY = 'spy_custom_word_packs';
export const ACTIVE_WORD_PACK_ID_KEY = 'spy_active_word_pack_id';

export interface WordPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectActivePack?: (pack: CustomWordPack | null) => void;
  activePackId?: string | null;
}

export const WordPackModal: React.FC<WordPackModalProps> = ({
  isOpen,
  onClose,
  onSelectActivePack,
  activePackId = null,
}) => {
  const [packs, setPacks] = useState<CustomWordPack[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(CUSTOM_WORD_PACKS_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as CustomWordPack[];
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  // New Pack Form state
  const [isCreatingPack, setIsCreatingPack] = useState(false);
  const [newPackName, setNewPackName] = useState('');
  const [newPackDesc, setNewPackDesc] = useState('');

  // New Pair Form state
  const [isAddingPair, setIsAddingPair] = useState(false);
  const [newCivWord, setNewCivWord] = useState('');
  const [newSpyWord, setNewSpyWord] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Persist packs helper
  const savePacks = (newPacks: CustomWordPack[]) => {
    setPacks(newPacks);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CUSTOM_WORD_PACKS_KEY, JSON.stringify(newPacks));
    }
  };

  useEffect(() => {
    if (packs.length > 0 && !selectedPackId) {
      setSelectedPackId(packs[0]!.id);
    }
  }, [packs, selectedPackId]);

  if (!isOpen) return null;

  const currentPack = packs.find((p) => p.id === selectedPackId);

  const handleCreatePack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackName.trim()) return;

    const newPack: CustomWordPack = {
      id: `pack_${Date.now()}`,
      name: newPackName.trim(),
      description: newPackDesc.trim() || undefined,
      createdAt: Date.now(),
      pairs: [],
    };

    const updated = [...packs, newPack];
    savePacks(updated);
    setSelectedPackId(newPack.id);
    setIsCreatingPack(false);
    setNewPackName('');
    setNewPackDesc('');
  };

  const handleDeletePack = (packId: string) => {
    const updated = packs.filter((p) => p.id !== packId);
    savePacks(updated);
    if (selectedPackId === packId) {
      setSelectedPackId(updated.length > 0 ? updated[0]!.id : null);
    }
    if (activePackId === packId && onSelectActivePack) {
      onSelectActivePack(null);
    }
  };

  const handleAddPair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPack || !newCivWord.trim() || !newSpyWord.trim()) return;
    if (newCivWord.trim().toLowerCase() === newSpyWord.trim().toLowerCase()) return;

    const newPair: WordPair = {
      id: `pair_${Date.now()}`,
      civilianWord: newCivWord.trim(),
      spyWord: newSpyWord.trim(),
      category: newCategory.trim() || 'Tùy chọn',
    };

    const updated = packs.map((p) =>
      p.id === currentPack.id ? { ...p, pairs: [...p.pairs, newPair] } : p
    );

    savePacks(updated);
    setIsAddingPair(false);
    setNewCivWord('');
    setNewSpyWord('');
    setNewCategory('');
    setAiTopic('');
    setAiError(null);
  };

  const handleAiSuggest = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const pair = await generateCustomWordPair(aiTopic.trim() || newCategory.trim() || undefined);
      setNewCivWord(pair.civilianWord);
      setNewSpyWord(pair.spyWord);
      if (pair.category) {
        setNewCategory(pair.category);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tạo gợi ý từ AI';
      setAiError(msg);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDeletePair = (pairId: string) => {
    if (!currentPack) return;
    const updated = packs.map((p) =>
      p.id === currentPack.id
        ? { ...p, pairs: p.pairs.filter((pair) => pair.id !== pairId) }
        : p
    );
    savePacks(updated);
  };

  const handleSelectActive = (pack: CustomWordPack | null) => {
    if (onSelectActivePack) {
      onSelectActivePack(pack);
    }
    if (typeof localStorage !== 'undefined') {
      if (pack) {
        localStorage.setItem(ACTIVE_WORD_PACK_ID_KEY, pack.id);
      } else {
        localStorage.removeItem(ACTIVE_WORD_PACK_ID_KEY);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col space-y-4 text-slate-100 my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Quản Lý Gói Từ Khóa</h3>
              <p className="text-[11px] text-slate-400">Tạo & chọn gói từ bí mật cho phòng chơi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action: Use default system pack */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/50 border border-slate-800">
          <div>
            <div className="text-xs font-bold text-slate-200">Kho từ mặc định của hệ thống</div>
            <div className="text-[11px] text-slate-400">{WORD_PAIRS.length} cặp từ tiếng Việt phong phú</div>
          </div>
          <button
            type="button"
            onClick={() => handleSelectActive(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              !activePackId
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {!activePackId ? 'Đang dùng' : 'Dùng mặc định'}
          </button>
        </div>

        {/* Pack Selection & Creation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Gói từ tùy chỉnh ({packs.length})</span>
            {!isCreatingPack && (
              <button
                type="button"
                onClick={() => setIsCreatingPack(true)}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold normal-case"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo gói mới</span>
              </button>
            )}
          </div>

          {/* Create Pack Form */}
          {isCreatingPack && (
            <form onSubmit={handleCreatePack} className="p-3 bg-slate-950 border border-cyan-800/60 rounded-2xl space-y-2.5">
              <input
                type="text"
                autoFocus
                placeholder="Tên gói (ví dụ: Bạn Thân, IT, Anime...)"
                value={newPackName}
                onChange={(e) => setNewPackName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <input
                type="text"
                placeholder="Mô tả ngắn (tùy chọn)"
                value={newPackDesc}
                onChange={(e) => setNewPackDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreatingPack(false)}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!newPackName.trim()}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  Lưu gói
                </button>
              </div>
            </form>
          )}

          {/* List of custom packs */}
          {packs.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {packs.map((p) => {
                const isSelected = p.id === selectedPackId;
                const isActive = p.id === activePackId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPackId(p.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 border transition-all text-left ${
                      isSelected
                        ? 'bg-slate-800 border-amber-500 text-slate-100 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">{p.name}</span>
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <span className="text-[10px] text-slate-500">{p.pairs.length} cặp từ</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Pack Details & Word Pairs Management */}
        {currentPack && (
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-100">{currentPack.name}</h4>
                {currentPack.description && (
                  <p className="text-[11px] text-slate-400">{currentPack.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectActive(currentPack)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    currentPack.id === activePackId
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold'
                  }`}
                >
                  {currentPack.id === activePackId ? 'Đang dùng' : 'Sử dụng gói này'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePack(currentPack.id)}
                  className="p-1 rounded-lg text-rose-400 hover:bg-rose-950/50"
                  title="Xóa gói"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Word Pairs in Pack */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Cặp từ ({currentPack.pairs.length})</span>
                {!isAddingPair && (
                  <button
                    type="button"
                    onClick={() => setIsAddingPair(true)}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm cặp từ</span>
                  </button>
                )}
              </div>

              {/* Add Pair Form */}
              {isAddingPair && (
                <form onSubmit={handleAddPair} className="p-3 bg-slate-900 border border-amber-500/40 rounded-xl space-y-2">
                  {/* AI Suggestion Bar */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      data-testid="modal-ai-topic-input"
                      placeholder="Chủ đề AI gợi ý (vd: Ẩm thực, IT...)"
                      value={aiTopic}
                      onChange={(e) => {
                        setAiTopic(e.target.value);
                        if (aiError) setAiError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAiSuggest();
                        }
                      }}
                      className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      data-testid="modal-ai-suggest-btn"
                      disabled={isAiLoading}
                      onClick={handleAiSuggest}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 shrink-0 disabled:opacity-50 transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      {isAiLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang tạo...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                          <span>AI gợi ý</span>
                        </>
                      )}
                    </button>
                  </div>

                  {aiError && (
                    <p data-testid="modal-ai-error-msg" className="text-[11px] text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{aiError}</span>
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Từ Dân Thường"
                      value={newCivWord}
                      onChange={(e) => setNewCivWord(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                    <input
                      type="text"
                      placeholder="Từ Gián Điệp"
                      value={newSpyWord}
                      onChange={(e) => setNewSpyWord(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Chủ đề (ví dụ: Đời sống, Game...)"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingPair(false);
                        setAiError(null);
                      }}
                      className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={!newCivWord.trim() || !newSpyWord.trim()}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg disabled:opacity-50"
                    >
                      Thêm
                    </button>
                  </div>
                </form>
              )}

              {/* Pairs list */}
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {currentPack.pairs.length === 0 ? (
                  <p className="text-center py-4 text-xs text-slate-500 italic">
                    Chưa có cặp từ nào trong gói này. Hãy bấm Thêm cặp từ!
                  </p>
                ) : (
                  currentPack.pairs.map((pair) => (
                    <div
                      key={pair.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-cyan-300">{pair.civilianWord}</span>
                        <span className="text-slate-500">vs</span>
                        <span className="font-semibold text-rose-300">{pair.spyWord}</span>
                        {pair.category && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                            {pair.category}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeletePair(pair.id)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
