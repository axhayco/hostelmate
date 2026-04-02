import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter } from './rateLimiter';

describe('RateLimiter', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    it('allows actions under the limit', () => {
        const limiter = new RateLimiter(3, 1000); // 3 requests per second
        expect(limiter.tryConsume('user-1').allowed).toBe(true);
        expect(limiter.tryConsume('user-1').allowed).toBe(true);
        expect(limiter.tryConsume('user-1').allowed).toBe(true);
    });

    it('blocks actions over the limit and enforces retryAfterMs', () => {
        const limiter = new RateLimiter(2, 5000); // 2 requests per 5 seconds
        expect(limiter.tryConsume('user-2').allowed).toBe(true);
        expect(limiter.tryConsume('user-2').allowed).toBe(true);

        const blockedResult = limiter.tryConsume('user-2');
        expect(blockedResult.allowed).toBe(false);
        expect(blockedResult.retryAfterMs).toBeGreaterThan(0);
        expect(blockedResult.retryAfterMs).toBeLessThanOrEqual(5000);
    });

    it('resets limits after the window expires', () => {
        const limiter = new RateLimiter(1, 2000); // 1 request per 2 seconds
        expect(limiter.tryConsume('user-3').allowed).toBe(true);
        expect(limiter.tryConsume('user-3').allowed).toBe(false);

        // Fast-forward time past the window
        vi.advanceTimersByTime(2001);

        expect(limiter.tryConsume('user-3').allowed).toBe(true);
    });

    it('isolates keys properly', () => {
        const limiter = new RateLimiter(1, 5000);
        expect(limiter.tryConsume('user-4').allowed).toBe(true);
        expect(limiter.tryConsume('user-4').allowed).toBe(false);

        // Different user should be allowed
        expect(limiter.tryConsume('user-5').allowed).toBe(true);
    });
});
