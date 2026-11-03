import { describe, it, expect, beforeEach } from 'vitest';
import { AppStore } from '../../src/lib/store';

describe('B2B Pilot: Data Backup & Digital Terms Acceptance', () => {
  const testTenantId = 'test-company-b2b';

  beforeEach(() => {
    // Reset/Setup company
    AppStore.addCompany({
      id: testTenantId,
      trade_name: 'Empresa Piloto B2B',
      corporate_name: 'Empresa Piloto B2B LTDA',
      cnpj: '11.222.333/0001-44',
      phone: '(11) 98888-0000',
      email: 'piloto@empresa.com'
    });
  });

  it('records digital terms acceptance with timestamp and operator name', () => {
    const accepted = AppStore.acceptCompanyTerms(testTenantId, 'Renan Admin', '2026.1');

    expect(accepted).toBeDefined();
    expect(accepted.terms_accepted_at).toBeDefined();
    expect(accepted.terms_accepted_by).toBe('Renan Admin');
    expect(accepted.terms_version).toBe('2026.1');

    // Retrieve via getCompany
    const company = AppStore.getCompany(testTenantId);
    expect(company.terms_accepted_by).toBe('Renan Admin');
    expect(company.terms_version).toBe('2026.1');
  });

  it('generates a full tenant backup containing all relational domain entities', () => {
    // Add customer to this tenant
    AppStore.addCustomer({
      tenant_id: testTenantId,
      name: 'Cliente Teste Backup',
      phone: '(11) 99999-8888',
      document: '123.456.789-00'
    });

    const backup = AppStore.getTenantBackupData(testTenantId);

    expect(backup).toBeDefined();
    expect(backup.platform).toBe('Agilis OS v2');
    expect(backup.tenant_id).toBe(testTenantId);
    expect(backup.company).toBeDefined();
    expect(backup.company?.trade_name).toBe('Empresa Piloto B2B');
    expect(backup.stats).toBeDefined();
    expect(backup.stats.total_customers).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(backup.customers)).toBe(true);
    expect(backup.customers.some((c: any) => c.name === 'Cliente Teste Backup')).toBe(true);
    expect(Array.isArray(backup.models)).toBe(true);
    expect(Array.isArray(backup.services)).toBe(true);
    expect(Array.isArray(backup.orders)).toBe(true);
  });
});
