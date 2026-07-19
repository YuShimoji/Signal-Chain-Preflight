import { describe, expect, it } from 'vitest';
import { baseInput } from './fixtures';
import { decodeShareHash, encodeShareHash } from './share';

describe('versioned URL hash sharing', () => {
  it('round-trips validated Japanese-labelled state', () => {
    const input = baseInput();
    const hash = encodeShareHash(input);
    expect(hash.startsWith('#preflight=v1.')).toBe(true);
    expect(decodeShareHash(hash)).toEqual(input);
  });

  it('rejects malformed and old-version data', () => {
    expect(decodeShareHash('#preflight=v1.not-valid')).toBeNull();
    expect(decodeShareHash('#preflight=v0.abc')).toBeNull();
  });

  it('rejects oversized payloads before decoding', () => {
    expect(decodeShareHash(`#preflight=v1.${'a'.repeat(16_000)}`)).toBeNull();
  });

  it('rejects an unknown schema version inside a valid base64url envelope', () => {
    const raw = JSON.stringify({ ...baseInput(), schemaVersion: 2 });
    let binary = '';
    new TextEncoder().encode(raw).forEach((byte) => { binary += String.fromCharCode(byte); });
    const payload = btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
    expect(decodeShareHash(`#preflight=v1.${payload}`)).toBeNull();
  });
});
