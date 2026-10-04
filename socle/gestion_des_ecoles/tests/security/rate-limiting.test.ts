import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../setup";
import { request } from "../helpers/request";

describe("Rate Limiting and Login Security", () => {
  beforeEach(async () => {
    // Clear login attempts before each test
    await prisma.loginAttempt.deleteMany({});
  });

  describe("Web login rate limiting", () => {
    it("should block after 5 failed attempts for same identifier", async () => {
      const identifier = "test-rate-limit@test.sn";

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        const res = await request("/api/auth/web-login", {
          method: "POST",
          body: { identifier, password: "wrongpassword" },
        });
        expect([401, 429]).toContain(res.status);
      }

      // 6th attempt should be rate limited
      const res = await request("/api/auth/web-login", {
        method: "POST",
        body: { identifier, password: "wrongpassword" },
      });

      expect(res.status).toBe(429);
      const data = res.data as { error?: string };
      expect(data.error).toContain("tentatives");
    });

    it("should block after 10 failed attempts from same IP", async () => {
      // Make 10 failed attempts with different identifiers
      for (let i = 0; i < 10; i++) {
        const res = await request("/api/auth/web-login", {
          method: "POST",
          body: {
            identifier: `test-ip-${i}@test.sn`,
            password: "wrongpassword",
          },
        });
        expect([401, 429]).toContain(res.status);
      }

      // 11th attempt should be rate limited
      const res = await request("/api/auth/web-login", {
        method: "POST",
        body: { identifier: "test-ip-11@test.sn", password: "wrongpassword" },
      });

      expect(res.status).toBe(429);
      const data = res.data as { error?: string };
      expect(data.error).toContain("tentatives");
    });
  });

  describe("Mobile login rate limiting", () => {
    it("should block after 5 failed attempts for same identifier", async () => {
      const identifier = "test-mobile-rate@test.sn";

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        const res = await request("/api/mobile/login", {
          method: "POST",
          body: { identifier, password: "wrongpassword" },
        });
        expect([401, 429]).toContain(res.status);
      }

      // 6th attempt should be rate limited
      const res = await request("/api/mobile/login", {
        method: "POST",
        body: { identifier, password: "wrongpassword" },
      });

      expect(res.status).toBe(429);
      const data = res.data as { error?: string };
      expect(data.error).toContain("tentatives");
    });

    it("should block after 10 failed attempts from same IP", async () => {
      // Make 10 failed attempts with different identifiers
      for (let i = 0; i < 10; i++) {
        const res = await request("/api/mobile/login", {
          method: "POST",
          body: {
            identifier: `test-mobile-ip-${i}@test.sn`,
            password: "wrongpassword",
          },
        });
        expect([401, 429]).toContain(res.status);
      }

      // 11th attempt should be rate limited
      const res = await request("/api/mobile/login", {
        method: "POST",
        body: {
          identifier: "test-mobile-ip-11@test.sn",
          password: "wrongpassword",
        },
      });

      expect(res.status).toBe(429);
      const data = res.data as { error?: string };
      expect(data.error).toContain("tentatives");
    });
  });

  describe("Phone number matching", () => {
    it("should match phone numbers exactly (normalized)", async () => {
      // Test that phone number normalization works correctly
      // The seed creates prof-dakar with +221771234567

      // Try with spaces
      const res1 = await request("/api/auth/web-login", {
        method: "POST",
        body: { identifier: "+221 77 123 45 67", password: "Admin@123" },
      });

      // Should succeed or fail auth, but not fail to find user
      // If it fails, it should be password error, not "not found"
      expect(res1.status).toBe(200);

      // Try without country code
      const res2 = await request("/api/auth/web-login", {
        method: "POST",
        body: { identifier: "771234567", password: "Admin@123" },
      });

      expect(res2.status).toBe(200);

      // Try with dots and dashes
      const res3 = await request("/api/auth/web-login", {
        method: "POST",
        body: { identifier: "+221-77.123.45.67", password: "Admin@123" },
      });

      expect(res3.status).toBe(200);
    });
  });

  describe("2FA code rate limiting", () => {
    it("should block after 3 failed 2FA attempts", async () => {
      // This test requires 2FA to be enabled
      // For now, we test the rate limiting logic by checking the database

      // Create a test 2FA challenge with hashed code
      const bcrypt = await import("bcryptjs");
      const codeHash = await bcrypt.hash("123456", 10);

      const challenge = await prisma.twoFactorChallenge.create({
        data: {
          userId: "test-user-id",
          codeHash,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      // Make 3 failed attempts
      for (let i = 0; i < 3; i++) {
        await prisma.loginAttempt.create({
          data: {
            userId: "test-user-id",
            identifier: challenge.id,
            ipAddress: "127.0.0.1",
            success: false,
            reason: "2fa_incorrect",
          },
        });
      }

      // Try to verify 2FA with correct code
      const res = await request("/api/auth/web-login", {
        method: "POST",
        body: {
          challengeId: challenge.id,
          code: "123456",
        },
      });

      // Should be rate limited
      expect(res.status).toBe(429);
      const data = res.data as { error?: string };
      expect(data.error).toContain("tentatives");
    });
  });

  describe("Staff portals rate limiting", () => {
    it("should apply rate limiting to staff login (directeur/prefet)", async () => {
      const identifier = "test-staff-rate@test.sn";

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        const res = await request("/api/auth/web-login", {
          method: "POST",
          body: {
            identifier,
            password: "wrongpassword",
            portail: "directeur",
          },
        });
        expect([401, 403, 429]).toContain(res.status);
      }

      // 6th attempt should be rate limited
      const res = await request("/api/auth/web-login", {
        method: "POST",
        body: {
          identifier,
          password: "wrongpassword",
          portail: "directeur",
        },
      });

      expect(res.status).toBe(429);
      const data = res.data as { error?: string };
      expect(data.error).toContain("tentatives");
    });
  });

  describe("Rate limit window expiry", () => {
    it("should only count attempts within 15-minute window", async () => {
      // Create old login attempts (more than 15 minutes ago)
      const oldTimestamp = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
      const identifier = "test-window@test.sn";

      // Insert 5 old failed attempts
      for (let i = 0; i < 5; i++) {
        await prisma.loginAttempt.create({
          data: {
            identifier,
            ipAddress: "127.0.0.1",
            success: false,
            reason: "mot_de_passe",
            createdAt: oldTimestamp,
          },
        });
      }

      // New attempt should NOT be rate limited (old attempts expired)
      const res = await request("/api/auth/web-login", {
        method: "POST",
        body: { identifier, password: "wrongpassword" },
      });

      // Should fail auth but not be rate limited
      expect(res.status).toBe(401);
    });
  });
});
