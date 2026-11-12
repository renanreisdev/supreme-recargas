/**
 * Supreme Recargas - Módulo de Segurança e Criptografia
 * Suporte a Hash SHA-256 com Salt, retrocompatibilidade com senhas legadas
 * e conformidade LGPD para anonimização de dados pessoais (PII).
 */

// Pure TypeScript SHA-256 implementation (FIPS 180-2)
function utf8Encode(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charCode = str.charCodeAt(i);
    if (charCode < 0x80) {
      bytes.push(charCode);
    } else if (charCode < 0x800) {
      bytes.push(0xc0 | (charCode >> 6));
      bytes.push(0x80 | (charCode & 0x3f));
    } else if (charCode < 0xd800 || charCode >= 0xe000) {
      bytes.push(0xe0 | (charCode >> 12));
      bytes.push(0x80 | ((charCode >> 6) & 0x3f));
      bytes.push(0x80 | (charCode & 0x3f));
    } else {
      i++;
      charCode = 0x10000 + (((charCode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      bytes.push(0xf0 | (charCode >> 18));
      bytes.push(0x80 | ((charCode >> 12) & 0x3f));
      bytes.push(0x80 | ((charCode >> 6) & 0x3f));
      bytes.push(0x80 | (charCode & 0x3f));
    }
  }
  return bytes;
}

export function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i: number, j: number;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  const encoded = utf8Encode(ascii);
  for (i = 0; i < encoded.length; i++) {
    words[i >> 2] |= (encoded[i] & 0xff) << ((3 - (i % 4)) * 8);
  }

  words[encoded.length >> 2] |= 0x80 << ((3 - (encoded.length % 4)) * 8);
  words[(((encoded.length + 8) >> 6) << 4) + 15] = encoded.length * 8;

  for (j = 0; j < words.length; j += 16) {
    const w: number[] = [];
    for (i = 0; i < 16; i++) {
      w[i] = words[j + i] || 0;
    }
    for (i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (((w[i - 16] + s0) | 0) + ((w[i - 7] + s1) | 0)) | 0;
    }

    let a = hash[0];
    let b = hash[1];
    let c = hash[2];
    let d = hash[3];
    let e = hash[4];
    let f = hash[5];
    let g = hash[6];
    let h = hash[7];

    for (i = 0; i < 64; i++) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (((((h + s1) | 0) + ch) | 0) + ((k[i] + w[i]) | 0)) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}

/**
 * Constant-time string equality check to prevent timing attacks
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Generates random hexadecimal salt using a cryptographically secure RNG.
 */
export function generateSalt(length = 16): string {
  const bytes = new Uint8Array(Math.ceil(length / 2));
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').slice(0, length);
}

/**
 * Hashes password using SHA-256 with salt.
 * Result format: `sha256:<salt>:<hash>`
 */
export function hashPassword(password: string, customSalt?: string): string {
  const salt = customSalt || generateSalt(16);
  const hash = sha256(`${salt}:${password}`);
  return `sha256:${salt}:${hash}`;
}

/**
 * Checks if a stored password string is already in the hashed format
 */
export function isPasswordHashed(stored: string): boolean {
  return typeof stored === 'string' && stored.startsWith('sha256:');
}

/**
 * Verifies password against stored hash or legacy plain-text password.
 */
export function verifyPassword(password: string, storedHashOrPlain: string): boolean {
  if (!storedHashOrPlain || !password) return false;

  // Hashed format check: sha256:<salt>:<hash>
  if (isPasswordHashed(storedHashOrPlain)) {
    const parts = storedHashOrPlain.split(':');
    if (parts.length !== 3) return false;
    const salt = parts[1];
    const expectedHash = parts[2];
    const calculatedHash = sha256(`${salt}:${password}`);
    return timingSafeEqual(calculatedHash, expectedHash);
  }

  // Legacy plain-text fallback comparison
  return timingSafeEqual(password, storedHashOrPlain);
}

/**
 * Anonymizes customer data according to LGPD guidelines, preserving
 * the financial and operational integrity of linked service orders.
 */
export function buildLgpdAnonymizedCustomer(customerId: string) {
  const suffix = customerId.slice(-4).toUpperCase();
  return {
    name: `Titular Anonimizado (LGPD #${suffix})`,
    document: '***.***.***-**',
    email: `anonimizado-${suffix.toLowerCase()}@lgpd.invalid`,
    phone: '(00) 00000-0000',
    address: '[Dados de endereço suprimidos conforme Art. 18 LGPD]',
    city: '[Anonimizado]',
    state: 'BR',
    postal_code: '00000-000',
    notes: 'Dados pessoais deste titular foram removidos sob demanda com base na Lei Geral de Proteção de Dados (LGPD).',
    is_anonymized: true,
    anonymized_at: new Date().toISOString()
  };
}
