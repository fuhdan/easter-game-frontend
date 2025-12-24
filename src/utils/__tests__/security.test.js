/**
 * Module: utils/__tests__/security.test.js
 * Purpose: Unit tests for security utilities
 * Part of: Easter Quest 2025 Frontend
 *
 * @since 2025-12-22
 */

import {
  maskUsername,
  maskEmail,
  maskToken,
  redactSensitiveData,
  containsSensitiveData,
  applyPIIMasking,
  sanitizeContext,
} from '../security';

describe('Security Utilities', () => {
  describe('maskUsername', () => {
    test('should mask username with 3+ characters', () => {
      expect(maskUsername('john_doe')).toBe('joh***');
      expect(maskUsername('alice123')).toBe('ali***');
      expect(maskUsername('bobby')).toBe('bob***');
    });

    test('should mask short usernames', () => {
      expect(maskUsername('ab')).toBe('***');
      expect(maskUsername('a')).toBe('***');
    });

    test('should handle edge cases', () => {
      expect(maskUsername('')).toBe('***');
      expect(maskUsername(null)).toBe('***');
      expect(maskUsername(undefined)).toBe('***');
      expect(maskUsername(123)).toBe('***'); // Not a string
    });
  });

  describe('maskEmail', () => {
    test('should mask email addresses', () => {
      expect(maskEmail('user@example.com')).toBe('u***@***.***');
      expect(maskEmail('john.doe@company.org')).toBe('j***@***.***');
      expect(maskEmail('a@b.c')).toBe('a***@***.***');
    });

    test('should handle invalid emails', () => {
      expect(maskEmail('invalid')).toBe('***@***.***');
      expect(maskEmail('no-at-sign')).toBe('***@***.***');
    });

    test('should handle edge cases', () => {
      expect(maskEmail('')).toBe('***@***.***');
      expect(maskEmail(null)).toBe('***@***.***');
      expect(maskEmail(undefined)).toBe('***@***.***');
    });
  });

  describe('maskToken', () => {
    test('should mask tokens with 10+ characters', () => {
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      expect(maskToken(jwt)).toBe('eyJhbGciOi***');

      const apiKey = 'sk-1234567890abcdef';
      expect(maskToken(apiKey)).toBe('sk-1234567***');
    });

    test('should mask short tokens', () => {
      expect(maskToken('short')).toBe('***');
      expect(maskToken('123456789')).toBe('***');
    });

    test('should handle edge cases', () => {
      expect(maskToken('')).toBe('***');
      expect(maskToken(null)).toBe('***');
      expect(maskToken(undefined)).toBe('***');
    });
  });

  describe('redactSensitiveData', () => {
    test('should redact password', () => {
      const data = { username: 'john', password: 'secret123' };
      const redacted = redactSensitiveData(data);

      expect(redacted.username).toBe('john');
      expect(redacted.password).toBe('[REDACTED]');
    });

    test('should redact multiple sensitive keys', () => {
      const data = {
        username: 'john',
        password: 'secret123',
        token: 'abc123',
        api_key: 'xyz789',
        secret: 'shhh',
      };
      const redacted = redactSensitiveData(data);

      expect(redacted.username).toBe('john');
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.token).toBe('[REDACTED]');
      expect(redacted.api_key).toBe('[REDACTED]');
      expect(redacted.secret).toBe('[REDACTED]');
    });

    test('should redact nested objects', () => {
      const data = {
        user: {
          name: 'John',
          credentials: {
            password: 'secret',
            token: 'abc123',
          },
        },
      };
      const redacted = redactSensitiveData(data);

      expect(redacted.user.name).toBe('John');
      expect(redacted.user.credentials.password).toBe('[REDACTED]');
      expect(redacted.user.credentials.token).toBe('[REDACTED]');
    });

    test('should handle arrays', () => {
      const data = {
        users: [
          { username: 'john', password: 'secret1' },
          { username: 'jane', password: 'secret2' },
        ],
      };
      const redacted = redactSensitiveData(data);

      expect(redacted.users[0].username).toBe('john');
      expect(redacted.users[0].password).toBe('[REDACTED]');
      expect(redacted.users[1].username).toBe('jane');
      expect(redacted.users[1].password).toBe('[REDACTED]');
    });

    test('should handle case-insensitive keys', () => {
      const data = {
        PASSWORD: 'secret',
        Token: 'abc',
        API_KEY: 'xyz',
      };
      const redacted = redactSensitiveData(data);

      expect(redacted.PASSWORD).toBe('[REDACTED]');
      expect(redacted.Token).toBe('[REDACTED]');
      expect(redacted.API_KEY).toBe('[REDACTED]');
    });

    test('should handle null and undefined', () => {
      expect(redactSensitiveData(null)).toBe(null);
      expect(redactSensitiveData(undefined)).toBe(undefined);
    });

    test('should handle primitives', () => {
      expect(redactSensitiveData('string')).toBe('string');
      expect(redactSensitiveData(123)).toBe(123);
      expect(redactSensitiveData(true)).toBe(true);
    });
  });

  describe('containsSensitiveData', () => {
    test('should detect sensitive keys', () => {
      expect(containsSensitiveData({ password: 'secret' })).toBe(true);
      expect(containsSensitiveData({ token: 'abc' })).toBe(true);
      expect(containsSensitiveData({ api_key: 'xyz' })).toBe(true);
      expect(containsSensitiveData({ secret: 'shhh' })).toBe(true);
    });

    test('should detect sensitive keys in nested objects', () => {
      const data = {
        user: {
          credentials: {
            password: 'secret',
          },
        },
      };
      expect(containsSensitiveData(data)).toBe(true);
    });

    test('should not detect non-sensitive data', () => {
      expect(containsSensitiveData({ username: 'john' })).toBe(false);
      expect(containsSensitiveData({ email: 'john@example.com' })).toBe(false);
      expect(containsSensitiveData({ age: 30 })).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(containsSensitiveData(null)).toBe(false);
      expect(containsSensitiveData(undefined)).toBe(false);
      expect(containsSensitiveData({})).toBe(false);
      expect(containsSensitiveData('string')).toBe(false);
    });
  });

  describe('applyPIIMasking', () => {
    test('should mask username, email, and token', () => {
      const context = {
        username: 'john_doe',
        email: 'john@example.com',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        age: 30,
      };
      const masked = applyPIIMasking(context);

      expect(masked.username).toBe('joh***');
      expect(masked.email).toBe('j***@***.***');
      expect(masked.token).toBe('eyJhbGciOi***');
      expect(masked.age).toBe(30);
    });

    test('should mask nested PII', () => {
      const context = {
        user: {
          username: 'john_doe',
          email: 'john@example.com',
        },
      };
      const masked = applyPIIMasking(context);

      expect(masked.user.username).toBe('joh***');
      expect(masked.user.email).toBe('j***@***.***');
    });

    test('should not modify non-PII fields', () => {
      const context = {
        userId: 42,
        role: 'player',
        score: 95,
      };
      const masked = applyPIIMasking(context);

      expect(masked).toEqual(context);
    });

    test('should handle edge cases', () => {
      expect(applyPIIMasking(null)).toBe(null);
      expect(applyPIIMasking(undefined)).toBe(undefined);
      expect(applyPIIMasking({})).toEqual({});
    });
  });

  describe('sanitizeContext', () => {
    test('should apply both PII masking and sensitive data redaction', () => {
      const context = {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'secret123',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        age: 30,
      };
      const sanitized = sanitizeContext(context);

      // PII should be masked
      expect(sanitized.username).toBe('joh***');
      expect(sanitized.email).toBe('j***@***.***');

      // Sensitive data should be redacted
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');

      // Non-sensitive data should be preserved
      expect(sanitized.age).toBe(30);
    });

    test('should handle nested data', () => {
      const context = {
        user: {
          username: 'john_doe',
          credentials: {
            password: 'secret',
            api_key: 'xyz789',
          },
        },
      };
      const sanitized = sanitizeContext(context);

      expect(sanitized.user.username).toBe('joh***');
      expect(sanitized.user.credentials.password).toBe('[REDACTED]');
      expect(sanitized.user.credentials.api_key).toBe('[REDACTED]');
    });

    test('should handle null/undefined', () => {
      expect(sanitizeContext(null)).toBe(null);
      expect(sanitizeContext(undefined)).toBe(undefined);
    });
  });
});
