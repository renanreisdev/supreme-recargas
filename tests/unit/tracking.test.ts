import { describe, it, expect } from 'vitest';
import { AppStore } from '../../src/lib/store';

describe('Public Tracking & Cross-Device Sync', () => {
  it('retrieves local entry by entry number', () => {
    const entry = AppStore.getEntryByToken('2026-000001');
    expect(entry).toBeDefined();
    expect(entry?.entry_number).toBe('2026-000001');
    expect(entry?.customer).toBeDefined();
    expect(entry?.cartridges?.length).toBeGreaterThan(0);
  });

  it('retrieves local entry by tracking token', () => {
    const entry = AppStore.getEntryByToken('trk-2026000001-abc1');
    expect(entry).toBeDefined();
    expect(entry?.entry_number).toBe('2026-000001');
  });

  it('handles case-insensitive lookup', () => {
    const entry = AppStore.getEntryByToken('TRK-2026000001-ABC1');
    expect(entry).toBeDefined();
    expect(entry?.entry_number).toBe('2026-000001');
  });

  it('asynchronously retrieves entry with getEntryByTokenAsync', async () => {
    const entry = await AppStore.getEntryByTokenAsync('2026-000002');
    expect(entry).toBeDefined();
    expect(entry?.entry_number).toBe('2026-000002');
    expect(entry?.customer?.name).toBe('Dra. Ana Paula Mendes');
  });

  it('returns undefined for non-existent token', async () => {
    const entry = await AppStore.getEntryByTokenAsync('non-existent-token-12345');
    expect(entry).toBeUndefined();
  });
});
