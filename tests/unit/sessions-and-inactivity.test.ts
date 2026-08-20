import { describe, it, expect, beforeEach } from 'vitest';
import { AppStore, MOCK_COMPANY_SUPREME } from '@/lib/store';
import { Profile } from '@/types';

describe('User Sessions, Inactivity Timeouts and Security Engine', () => {
  beforeEach(() => {
    // Reset local data store
    const store = (AppStore as any).getStoreData();
    (AppStore as any).saveStoreData(store, true);
  });

  it('generates a unique active session token and records device info upon authentication', () => {
    const user = AppStore.authenticate('admin@supreme.com.br', 'admin123', {
      device: 'Windows 11 • Chrome 128',
      ip: '192.168.1.100'
    });

    expect(user).toBeDefined();
    expect(user.active_session_token).toBeDefined();
    expect(typeof user.active_session_token).toBe('string');
    expect(user.active_session_token!.length).toBeGreaterThan(10);
    expect(user.active_session_device).toBe('Windows 11 • Chrome 128');
    expect(user.active_session_ip).toBe('192.168.1.100');
    expect(user.active_session_at).toBeDefined();

    // Verify in store
    const profiles = AppStore.getAllProfiles();
    const storedUser = profiles.find(p => p.id === user.id);
    expect(storedUser?.active_session_token).toBe(user.active_session_token);
    expect(storedUser?.active_session_device).toBe('Windows 11 • Chrome 128');
  });

  it('invalidates prior session token when a concurrent login occurs on another device', () => {
    // 1st login (Device A)
    const firstLogin = AppStore.authenticate('atendente1@supreme.com.br', 'atendente123', {
      device: 'iPhone 15 • Safari',
      ip: '10.0.0.5'
    });
    const firstToken = firstLogin.active_session_token;
    expect(firstToken).toBeDefined();

    // 2nd login (Device B)
    const secondLogin = AppStore.authenticate('atendente1@supreme.com.br', 'atendente123', {
      device: 'Windows • Chrome',
      ip: '10.0.0.20'
    });
    const secondToken = secondLogin.active_session_token;

    expect(secondToken).toBeDefined();
    expect(secondToken).not.toBe(firstToken);
    expect(secondLogin.active_session_device).toBe('Windows • Chrome');

    // Profile in store now holds the new token
    const storedUser = AppStore.getAllProfiles().find(p => p.id === secondLogin.id);
    expect(storedUser?.active_session_token).toBe(secondToken);
    expect(storedUser?.active_session_token).not.toBe(firstToken);
  });

  it('clears active session token and device when user logs out', () => {
    const user = AppStore.authenticate('tecnico1@supreme.com.br', 'tecnico123', {
      device: 'Android Tablet • Chrome'
    });
    expect(user.active_session_token).toBeDefined();

    AppStore.logLogout(user);

    const storedUser = AppStore.getAllProfiles().find(p => p.id === user.id);
    expect(storedUser?.active_session_token).toBeUndefined();
    expect(storedUser?.active_session_device).toBeUndefined();
  });

  it('allows administrator to terminate remote active session', () => {
    const user = AppStore.authenticate('atendente2@supreme.com.br', 'atendente123', {
      device: 'Notebook Dell • Windows 11'
    });
    expect(user.active_session_token).toBeDefined();

    const terminated = AppStore.terminateUserSession(user.id, 'Carlos Oliveira (Admin)');
    expect(terminated.active_session_token).toBeUndefined();
    expect(terminated.active_session_device).toBeUndefined();
    expect(terminated.active_session_at).toBeUndefined();

    const storedUser = AppStore.getAllProfiles().find(p => p.id === user.id);
    expect(storedUser?.active_session_token).toBeUndefined();
  });

  it('resolves inactivity timeout with proper hierarchy (user -> group -> company -> 0 default)', () => {
    const admin = AppStore.getAllProfiles().find(p => p.email === 'admin@supreme.com.br')!;
    
    // Default when nothing set is 0 (disabled)
    expect(AppStore.getUserInactivityTimeout(admin.id)).toBe(0);

    // 1. Group default applies
    const groups = AppStore.getPermissionGroups(admin.tenant_id);
    const adminGroup = groups.find(g => g.id === admin.group_id);
    if (adminGroup) {
      AppStore.updatePermissionGroup(adminGroup.id, {
        default_inactivity_timeout_minutes: 30
      });
      expect(AppStore.getUserInactivityTimeout(admin.id)).toBe(30);
    }

    // 2. Individual user override takes precedence over group
    AppStore.updateUserInactivityTimeout(admin.id, 15, 'Admin');
    expect(AppStore.getUserInactivityTimeout(admin.id)).toBe(15);

    // 3. Updating via updateUserPermissions preserves timeout
    AppStore.updateUserPermissions(admin.id, admin.custom_permissions || {}, 'Admin', 100, 45);
    expect(AppStore.getUserInactivityTimeout(admin.id)).toBe(45);
  });
});
