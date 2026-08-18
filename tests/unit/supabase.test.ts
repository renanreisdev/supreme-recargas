import { describe, it, expect } from 'vitest';
import { supabase } from '../../src/lib/supabase';

describe('Supabase Cloud Database Connectivity', () => {
  it('connects to Supabase and queries companies', async () => {
    const { data, error } = await supabase.from('companies').select('*');
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);
    expect(data![0].trade_name).toContain('Supreme');
  });

  it('queries models from Supabase', async () => {
    const { data, error } = await supabase.from('cartridge_models').select('*');
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);
  });

  it('queries customer records from Supabase', async () => {
    const { data, error } = await supabase.from('customers').select('*');
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);
  });
});
