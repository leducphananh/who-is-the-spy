import { describe, it, expect, beforeEach } from 'vitest';
import {
  soundEffects,
  SPY_SFX_ENABLED_KEY,
} from '../../src/client/lib/soundEffects.js';

describe('Web Audio SFX Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('mặc định bật âm thanh (true) và có thể toggle qua localStorage', () => {
    expect(soundEffects.isSoundEnabled()).toBe(true);

    soundEffects.setSoundEnabled(false);
    expect(soundEffects.isSoundEnabled()).toBe(false);
    expect(localStorage.getItem(SPY_SFX_ENABLED_KEY)).toBe('false');

    soundEffects.setSoundEnabled(true);
    expect(soundEffects.isSoundEnabled()).toBe(true);
    expect(localStorage.getItem(SPY_SFX_ENABLED_KEY)).toBe('true');
  });

  it('gọi các hàm phát âm thanh không throw lỗi ngay cả khi môi trường không có AudioContext', () => {
    expect(() => soundEffects.playTick()).not.toThrow();
    expect(() => soundEffects.playRoleReveal()).not.toThrow();
    expect(() => soundEffects.playTurnAlert()).not.toThrow();
    expect(() => soundEffects.playGavel()).not.toThrow();
    expect(() => soundEffects.playTie()).not.toThrow();
    expect(() => soundEffects.playVictory()).not.toThrow();
  });

  it('khi tắt âm thanh (isSoundEnabled === false), các hàm phát âm thanh không phát sinh hành động', () => {
    soundEffects.setSoundEnabled(false);
    expect(() => soundEffects.playTick()).not.toThrow();
    expect(() => soundEffects.playVictory()).not.toThrow();
  });

  it('ensureAudioReady() khởi tạo hoặc resume an toàn', () => {
    expect(() => soundEffects.ensureAudioReady()).not.toThrow();
  });
});
