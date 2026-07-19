import { preflightInputSchema } from './schemas';
import type { PreflightInput } from './types';

const PREFIX = '#preflight=v1.';
const MAX_HASH_LENGTH = 16_000;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function encodeShareHash(input: PreflightInput): string {
  const validated = preflightInputSchema.parse(input);
  const payload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(validated)));
  const hash = `${PREFIX}${payload}`;
  if (hash.length > MAX_HASH_LENGTH) throw new Error('SHARE_PAYLOAD_TOO_LARGE');
  return hash;
}

export function decodeShareHash(hash: string): PreflightInput | null {
  if (!hash.startsWith(PREFIX) || hash.length > MAX_HASH_LENGTH) return null;
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(hash.slice(PREFIX.length)));
    return preflightInputSchema.parse(JSON.parse(json));
  } catch {
    return null;
  }
}
