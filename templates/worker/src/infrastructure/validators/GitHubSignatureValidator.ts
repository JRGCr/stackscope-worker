import { IGitHubSignatureValidator } from '../../domain/interfaces/IGitHubWebhookProcessor';

export class GitHubSignatureValidator implements IGitHubSignatureValidator {
  
  async validateSignature(payload: string, signature: string, secret: string): Promise<boolean> {
    if (!signature || !secret) {
      return false;
    }

    try {
      const expectedSignature = await this.generateSignature(payload, secret);
      return this.secureCompare(signature, expectedSignature);
    } catch (error) {
      console.error('Signature validation error:', error);
      return false;
    }
  }

  extractSignature(signatureHeader: string): string {
    // GitHub sends signature as "sha256=<signature>"
    if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
      return '';
    }
    return signatureHeader.substring(7);
  }

  private async generateSignature(payload: string, secret: string): Promise<string> {
    // Convert secret to Uint8Array
    const encoder = new TextEncoder();
    const key = encoder.encode(secret);
    
    // Import the key for HMAC
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Sign the payload
    const payloadData = encoder.encode(payload);
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, payloadData);
    
    // Convert to hex string
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}