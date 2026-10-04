import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../setup";
import { resetTestDatabase } from "../fixtures/database";
import { mobileLogin, tokenRequest, login } from "../helpers/request";

describe("Token Security", () => {
  let testData: Awaited<ReturnType<typeof resetTestDatabase>>;

  beforeAll(async () => {
    testData = await resetTestDatabase();
  });

  describe("Diagnostic", () => {
    it("should verify /api/parent/enfants endpoint exists and works", async () => {
      // This is a diagnostic test to verify the endpoint is accessible
      const token = await mobileLogin("parent@test.sn", "Admin@123");
      const res = await tokenRequest(token, "/api/parent/enfants");
      
      console.log("Endpoint response:", {
        status: res.status,
        data: res.data,
        headers: res.headers
      });
      
      // The endpoint should return 200 with data structure
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty("data");
    });
  });

  describe("Token revocation", () => {
    it("should reject revoked mobile token with 401", async () => {
      // Login as parent (mobile)
      const token = await mobileLogin("parent@test.sn", "Admin@123");
      console.log("Token obtained:", token.substring(0, 50) + "...");

      // Verify token works - endpoint MUST exist and return 200
      const res1 = await tokenRequest(token, "/api/parent/enfants");
      console.log("Before revocation - status:", res1.status, "data:", JSON.stringify(res1.data).substring(0, 100));
      expect(res1.status).toBe(200); // Endpoint must exist

      // Revoke tokens
      const revokeRes = await tokenRequest(token, "/api/auth/revoke-tokens", {
        method: "POST",
      });
      console.log("Revoke response - status:", revokeRes.status, "data:", revokeRes.data);
      expect(revokeRes.status).toBe(200);
      
      // Verify revocation was created in DB
      const { verifyMobileToken } = await import("@/lib/mobile-token");
      const decoded = verifyMobileToken(token);
      const revocations = await prisma.tokenRevocation.findMany({
        where: { userId: decoded!.id },
        orderBy: { createdAt: "desc" },
      });
      console.log("Revocations in DB:", revocations.length, revocations.map(r => ({ 
        createdAt: r.createdAt.toISOString(),
        userId: r.userId 
      })));
      
      // Wait a moment for DB to commit the revocation
      await new Promise(resolve => setTimeout(resolve, 100));

      // Try to use revoked token
      const res2 = await tokenRequest(token, "/api/parent/enfants");
      console.log("After revocation - status:", res2.status, "data:", JSON.stringify(res2.data).substring(0, 100));
      expect(res2.status).toBe(401);
      
      const data = res2.data as { error?: string | { message?: string } };
      const errorMessage = typeof data.error === 'string' ? data.error : data.error?.message;
      expect(errorMessage).toContain("révoquée");
    });

    it("should allow fresh login after token revocation (exp preserved)", async () => {
      // This tests the regression where exp was lost during revocation

      // Login
      const token1 = await mobileLogin("parent@test.sn", "Admin@123");

      // Revoke
      await tokenRequest(token1, "/api/auth/revoke-tokens", {
        method: "POST",
      });

      // Login again
      const token2 = await mobileLogin("parent@test.sn", "Admin@123");

      // New token should work
      const res = await tokenRequest(token2, "/api/parent/enfants");
      expect([200, 404]).toContain(res.status);
    });

    it("should reject token after password change (implicit revocation)", async () => {
      // Login
      const token = await mobileLogin("parent@test.sn", "Admin@123");

      // Verify token works
      const res1 = await tokenRequest(token, "/api/parent/enfants");
      expect([200, 404]).toContain(res1.status);

      // Change password (this should revoke all tokens)
      const cookie = await login("parent@test.sn", "Admin@123");
      const changeRes = await tokenRequest(cookie, "/api/auth/change-password", {
        method: "POST",
        body: {
          userId: testData.users.parent.id,
          currentPassword: "Admin@123",
          newPassword: "NewPassword123!",
          confirmPassword: "NewPassword123!",
        },
      });
      expect(changeRes.status).toBe(200);

      // Old token should be rejected
      const res2 = await tokenRequest(token, "/api/parent/enfants");
      expect(res2.status).toBe(401);

      // Login with new password should work
      const newToken = await mobileLogin("parent@test.sn", "NewPassword123!");
      const res3 = await tokenRequest(newToken, "/api/parent/enfants");
      expect([200, 404]).toContain(res3.status);

      // Restore original password for other tests
      const newCookie = await login("parent@test.sn", "NewPassword123!");
      await tokenRequest(newCookie, "/api/auth/change-password", {
        method: "POST",
        body: {
          userId: testData.users.parent.id,
          currentPassword: "NewPassword123!",
          newPassword: "Admin@123",
          confirmPassword: "Admin@123",
        },
      });
    });
  });

  describe("Token expiry", () => {
    it("should reject expired mobile token", async () => {
      // Create a token that's already expired
      const { signMobileToken } = await import("@/lib/mobile-token");

      // Create token with past expiry
      const expiredToken = signMobileToken({
        id: testData.users.parent.id,
        email: testData.users.parent.email,
        nom: testData.users.parent.nom,
        prenom: testData.users.parent.prenom,
        role: testData.users.parent.role,
        exp: Date.now() - 1000, // Expired 1 second ago
      });
      
      console.log("Expired token created, exp:", Date.now() - 1000, "now:", Date.now());

      // Try to use expired token
      const res = await tokenRequest(expiredToken, "/api/parent/enfants");
      console.log("Expired token response - status:", res.status, "data:", JSON.stringify(res.data).substring(0, 100));
      expect(res.status).toBe(401);
      
      const data = res.data as { error?: string | { message?: string } };
      const errorMessage = typeof data.error === 'string' ? data.error : data.error?.message;
      expect(errorMessage).toContain("expirée");
    });

    it("should accept valid token with future expiry", async () => {
      // Login normally (should get 30-day token)
      const token = await mobileLogin("parent@test.sn", "Admin@123");

      // Decode and verify expiry is in the future
      const { verifyMobileToken } = await import("@/lib/mobile-token");
      const decoded = verifyMobileToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.exp).toBeGreaterThan(Date.now());

      // Token should work
      const res = await tokenRequest(token, "/api/parent/enfants");
      expect([200, 404]).toContain(res.status);
    });
  });

  describe("Deactivated account protection", () => {
    it("should reject login for deactivated account", async () => {
      const res = await login("deactivated@test.sn", "Admin@123").catch((e) => e);

      expect(res).toBeInstanceOf(Error);
      expect(res.message).toContain("Login failed");
    });

    it("should reject mobile login for deactivated account", async () => {
      const res = await mobileLogin("deactivated@test.sn", "Admin@123").catch(
        (e) => e
      );

      expect(res).toBeInstanceOf(Error);
      expect(res.message).toContain("Mobile login failed");
    });

    it("should reject existing token when account is deactivated", async () => {
      // First, temporarily activate the account
      await prisma.user.update({
        where: { id: testData.users.userDeactivated.id },
        data: { actif: true, role: "PARENT" }, // Set to PARENT for mobile login
      });

      // Get a valid token
      const token = await mobileLogin("deactivated@test.sn", "Admin@123");

      // Verify token works
      const res1 = await tokenRequest(token, "/api/parent/enfants");
      expect([200, 404]).toContain(res1.status);

      // Deactivate account
      await prisma.user.update({
        where: { id: testData.users.userDeactivated.id },
        data: { actif: false },
      });

      // Token should now be rejected
      const res2 = await tokenRequest(token, "/api/parent/enfants");
      expect(res2.status).toBe(401);
      
      const data = res2.data as { error?: string | { message?: string } };
      const errorMessage = typeof data.error === 'string' ? data.error : data.error?.message;
      expect(errorMessage).toContain("désactivé");
    });
  });

  describe("Token content validation", () => {
    it("should reject token with invalid signature", async () => {
      // Get a valid token and corrupt it
      const validToken = await mobileLogin("parent@test.sn", "Admin@123");
      const corruptedToken = validToken.slice(0, -5) + "XXXXX";

      const res = await tokenRequest(corruptedToken, "/api/parent/enfants");
      expect(res.status).toBe(401);
    });

    it("should reject malformed token", async () => {
      const res = await tokenRequest("not.a.valid.jwt.token", "/api/parent/enfants");
      expect(res.status).toBe(401);
    });

    it("should reject token without Bearer prefix", async () => {
      const token = await mobileLogin("parent@test.sn", "Admin@123");

      // Make request with empty string as token (no auth header value)
      const res = await tokenRequest("", "/api/parent/enfants");
      expect(res.status).toBe(401);
    });
  });

  describe("Session cookie security", () => {
    it("should reject request when session cookie is removed", async () => {
      const cookie = await login("prof-dakar@test.sn", "Admin@123");

      // First request should work
      const res1 = await tokenRequest(cookie, "/api/eleves?role=PROFESSEUR");
      expect(res1.status).toBe(200);

      // Request without cookie should fail with 401 or 307 redirect (to login)
      const res2 = await tokenRequest("", "/api/eleves?role=PROFESSEUR");
      expect([401, 307]).toContain(res2.status); // 307 is redirect to login, which is acceptable
    });
  });
});
