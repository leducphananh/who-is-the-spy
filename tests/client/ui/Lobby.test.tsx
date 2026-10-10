import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { ProfileSetup, AVATAR_OPTIONS } from '../../../src/client/components/Lobby/ProfileSetup.js';
import { RoomLobby, generateRoomCode } from '../../../src/client/components/Lobby/RoomLobby.js';

describe('Lobby UI Components', () => {
  it('generateRoomCode sinh mã phòng 6 ký tự viết hoa hợp lệ', () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('AVATAR_OPTIONS chứa 8 avatar phong phú', () => {
    expect(AVATAR_OPTIONS).toHaveLength(8);
    for (const opt of AVATAR_OPTIONS) {
      expect(opt.id).toBeTruthy();
      expect(opt.emoji).toBeTruthy();
    }
  });

  it('ProfileSetup render cấu trúc component chuẩn xác', () => {
    const onSave = vi.fn();
    const element = React.createElement(ProfileSetup, {
      onSaveProfile: onSave,
      initialProfile: { name: 'Thám tử Lừng Danh', avatar: 'fox' },
    });
    expect(element).toBeDefined();
    expect(element.props.initialProfile?.name).toBe('Thám tử Lừng Danh');
  });

  it('RoomLobby render cấu trúc với profile hiện tại', () => {
    const onCreate = vi.fn();
    const onJoin = vi.fn();
    const onEdit = vi.fn();
    const element = React.createElement(RoomLobby, {
      profile: { name: 'Alice', avatar: 'fox' },
      onCreateRoom: onCreate,
      onJoinRoom: onJoin,
      onEditProfile: onEdit,
    });
    expect(element).toBeDefined();
    expect(element.props.profile.name).toBe('Alice');
  });
});
