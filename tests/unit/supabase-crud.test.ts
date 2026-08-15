import { describe, it, expect } from 'vitest';
import { supabase } from '../../src/lib/supabase';

describe('Supabase CRUD Operations', () => {
  it('inserts and reads a test customer', async () => {
    const testCustomerId = `ca000000-0000-0000-0000-${Date.now().toString().slice(-12).padStart(12, '0')}`;
    const { data: inserted, error: insertError } = await supabase.from('customers').insert({
      id: testCustomerId,
      tenant_id: 'b2000000-0000-0000-0000-000000000001',
      name: 'Cliente Teste Automatizado',
      phone: '(11) 99999-9999',
      company_name: 'Empresa Teste'
    }).select().single();

    expect(insertError).toBeNull();
    expect(inserted).toBeDefined();
    expect(inserted.name).toBe('Cliente Teste Automatizado');

    // Clean up test customer
    await supabase.from('customers').delete().eq('id', testCustomerId);
  });
});
