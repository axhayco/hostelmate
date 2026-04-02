import { describe, it, expect } from 'vitest';
import { sanitizeText, validateField, profileSchema } from './validation';
import { z } from 'zod';

describe('Validation Utilities', () => {
    describe('sanitizeText', () => {
        it('trims whitespace', () => {
            expect(sanitizeText('  hello world  ')).toBe('hello world');
        });

        it('strips basic HTML tags', () => {
            expect(sanitizeText('<script>alert("xss")</script>hello')).toBe('alert("xss")hello');
            expect(sanitizeText('<b>bold</b> text')).toBe('bold text');
        });

        it('handles empty strings', () => {
            expect(sanitizeText('')).toBe('');
            expect(sanitizeText('   ')).toBe('');
        });
    });

    describe('validateField', () => {
        const simpleSchema = z.object({
            username: z.string().min(3, "Too short"),
        });

        it('returns success for valid data', () => {
            const result = validateField(simpleSchema, { username: 'testuser' });
            expect(result.success).toBe(true);
            if ("success" in result && "data" in result && result.success) { // Type check narrowing
                expect((result.data as { username: string }).username).toBe('testuser');
            }
        });

        it('returns formatted error for invalid data', () => {
            const result = validateField(simpleSchema, { username: 'a' });
            expect(result.success).toBe(false);
            if ("error" in result) {
                expect(result.error as string).toContain('Too short');
            }
        });
    });

    describe('profileSchema', () => {
        it('validates a correct profile', () => {
            const validProfile = {
                name: "John Doe",
                email: "john@example.com",
                phone: "9876543210",
                college: "NIT Trichy",
                bio: "Student"
            };
            const result = validateField(profileSchema, validProfile);
            expect(result.success).toBe(true);
        });

        it('fails on invalid email', () => {
            const invalidProfile = {
                name: "John Doe",
                email: "not-an-email",
            };
            const result = validateField(profileSchema, invalidProfile);
            expect(result.success).toBe(false);
        });
    });
});
