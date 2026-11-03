import { describe, it, expect } from 'vitest';
import {
  sha256,
  hashPassword,
  verifyPassword,
  isPasswordHashed,
  buildLgpdAnonymizedCustomer
} from '@/lib/security';

describe('Security & Cryptography Module', () => {
  it('computes correct sha256 checksum', () => {
    // Known test vector for 'hello world'
    const hash = sha256('hello world');
    expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });

  it('hashes passwords with unique salts', () => {
    const hash1 = hashPassword('segredo123');
    const hash2 = hashPassword('segredo123');

    expect(isPasswordHashed(hash1)).toBe(true);
    expect(isPasswordHashed(hash2)).toBe(true);
    // Even with the same password, the random salts make them different
    expect(hash1).not.toBe(hash2);
  });

  it('verifies password against hashed format', () => {
    const password = 'MinhaSenhaSegura@2026';
    const hash = hashPassword(password);

    expect(verifyPassword(password, hash)).toBe(true);
    expect(verifyPassword('senhaIncorreta', hash)).toBe(false);
  });

  it('verifies legacy plain-text password for backward compatibility', () => {
    const plain = 'admin123';
    expect(isPasswordHashed(plain)).toBe(false);
    expect(verifyPassword('admin123', plain)).toBe(true);
    expect(verifyPassword('errada', plain)).toBe(false);
  });

  it('anonymizes customer data according to LGPD standards', () => {
    const anon = buildLgpdAnonymizedCustomer('cust-1234-abcd');
    expect(anon.name).toContain('Titular Anonimizado (LGPD #ABCD)');
    expect(anon.document).toBe('***.***.***-**');
    expect(anon.phone).toBe('(00) 00000-0000');
    expect(anon.is_anonymized).toBe(true);
    expect(anon.anonymized_at).toBeDefined();
  });
});
