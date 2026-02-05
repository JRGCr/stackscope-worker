import { describe, it, expect, beforeEach } from 'vitest';
import { GitHubSignatureValidator } from '../src/infrastructure/validators/GitHubSignatureValidator';

describe('GitHubSignatureValidator', () => {
  let validator: GitHubSignatureValidator;

  beforeEach(() => {
    validator = new GitHubSignatureValidator();
  });

  describe('extractSignature', () => {
    it('should extract signature from valid header', () => {
      const header = 'sha256=abc123def456';
      expect(validator.extractSignature(header)).toBe('abc123def456');
    });

    it('should return empty string for invalid header format', () => {
      expect(validator.extractSignature('sha1=abc123')).toBe('');
      expect(validator.extractSignature('abc123')).toBe('');
      expect(validator.extractSignature('')).toBe('');
    });

    it('should return empty string for null/undefined header', () => {
      expect(validator.extractSignature(null as any)).toBe('');
      expect(validator.extractSignature(undefined as any)).toBe('');
    });
  });

  describe('validateSignature', () => {
    const secret = 'test-secret';
    const payload = '{"test": "data"}';

    it('should return false for empty signature', async () => {
      const result = await validator.validateSignature(payload, '', secret);
      expect(result).toBe(false);
    });

    it('should return false for empty secret', async () => {
      const result = await validator.validateSignature(payload, 'somesig', '');
      expect(result).toBe(false);
    });

    it('should validate correct signature', async () => {
      // Generate a known valid signature for testing
      const encoder = new TextEncoder();
      const key = encoder.encode(secret);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const payloadData = encoder.encode(payload);
      const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, payloadData);
      const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const result = await validator.validateSignature(payload, expectedSignature, secret);
      expect(result).toBe(true);
    });

    it('should reject invalid signature', async () => {
      const result = await validator.validateSignature(payload, 'invalidsignature123', secret);
      expect(result).toBe(false);
    });

    it('should reject signature with wrong length', async () => {
      const result = await validator.validateSignature(payload, 'short', secret);
      expect(result).toBe(false);
    });
  });
});
