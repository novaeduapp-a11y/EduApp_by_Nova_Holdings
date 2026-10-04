import { describe, it, expect, beforeAll } from "vitest";
import { resetTestDatabase } from "../fixtures/database";
import { login, request, authRequest, mobileLogin } from "../helpers/request";

describe("Password Security", () => {
  let testData: Awaited<ReturnType<typeof resetTestDatabase>>;

  beforeAll(async () => {
    testData = await resetTestDatabase();
  });

  describe("mustChangePassword flow", () => {
    it("should reject login with PASSWORD_CHANGE_REQUIRED when mustChangePassword=true", async () => {
      const res = await request("/api/auth/web-login", {
        method: "POST",
        body: {
          identifier: "mustchange@test.sn",
          password: "Admin@123",
        },
      });

      expect(res.status).toBe(403);
      const data = res.data as {
        error?: string;
        code?: string;
        userId?: string;
      };

      expect(data.code).toBe("PASSWORD_CHANGE_REQUIRED");
      expect(data.userId).toBe(testData.users.userMustChange.id);
      expect(data.error).toContain("Changement de mot de passe requis");
    });

    it("should reject mobile login with PASSWORD_CHANGE_REQUIRED", async () => {
      const res = await request("/api/mobile/login", {
        method: "POST",
        body: {
          identifier: "mustchange@test.sn",
          password: "Admin@123",
        },
      });

      expect(res.status).toBe(403);
      const data = res.data as {
        error?: string;
        code?: string;
        userId?: string;
      };

      expect(data.code).toBe("PASSWORD_CHANGE_REQUIRED");
    });

    it("should allow password change and then normal login", async () => {
      // Change password
      const changeRes = await request("/api/auth/change-password", {
        method: "POST",
        body: {
          userId: testData.users.userMustChange.id,
          currentPassword: "Admin@123",
          newPassword: "NewSecurePass123!",
          confirmPassword: "NewSecurePass123!",
        },
      });

      expect(changeRes.status).toBe(200);

      // Should now be able to login normally
      const loginRes = await request("/api/auth/web-login", {
        method: "POST",
        body: {
          identifier: "mustchange@test.sn",
          password: "NewSecurePass123!",
        },
      });

      expect(loginRes.status).toBe(200);
      const data = loginRes.data as { data?: { ok?: boolean } };
      expect(data.data?.ok).toBe(true);

      // Restore original password and mustChangePassword flag for other tests
      await request("/api/auth/change-password", {
        method: "POST",
        body: {
          userId: testData.users.userMustChange.id,
          currentPassword: "NewSecurePass123!",
          newPassword: "Admin@123",
          confirmPassword: "Admin@123",
        },
      });

      // Re-enable mustChangePassword flag
      const { prisma } = await import("../setup");
      await prisma.user.update({
        where: { id: testData.users.userMustChange.id },
        data: { mustChangePassword: true },
      });
    });
  });

  describe("Change password requires current password", () => {
    it("should reject password change with wrong current password", async () => {
      const res = await request("/api/auth/change-password", {
        method: "POST",
        body: {
          userId: testData.users.profDakar.id,
          currentPassword: "WrongPassword123",
          newPassword: "NewPassword123!",
          confirmPassword: "NewPassword123!",
        },
      });

      expect(res.status).toBe(401);
      const data = res.data as { error?: { code?: string; message?: string } };
      expect(data.error?.code).toBe("INVALID_PASSWORD");
      expect(data.error?.message).toContain("actuel incorrect");
    });

    it("should reject password change without current password", async () => {
      const res = await request("/api/auth/change-password", {
        method: "POST",
        body: {
          userId: testData.users.profDakar.id,
          currentPassword: "",
          newPassword: "NewPassword123!",
          confirmPassword: "NewPassword123!",
        },
      });

      expect(res.status).toBe(400);
      const data = res.data as { error?: { code?: string } };
      expect(data.error?.code).toBe("VALIDATION_ERROR");
    });

    it("should successfully change password with correct current password", async () => {
      const res = await request("/api/auth/change-password", {
        method: "POST",
        body: {
          userId: testData.users.profDakar.id,
          currentPassword: "Admin@123",
          newPassword: "NewSecurePassword123!",
          confirmPassword: "NewSecurePassword123!",
        },
      });

      expect(res.status).toBe(200);
      const data = res.data as { success?: boolean; message?: string };
      expect(data.success).toBe(true);

      // Verify old password no longer works
      const oldLoginRes = await request("/api/auth/web-login", {
        method: "POST",
        body: {
          identifier: "prof-dakar@test.sn",
          password: "Admin@123",
        },
      });
      expect(oldLoginRes.status).toBe(401);

      // Verify new password works
      const newLoginRes = await request("/api/auth/web-login", {
        method: "POST",
        body: {
          identifier: "prof-dakar@test.sn",
          password: "NewSecurePassword123!",
        },
      });
      expect(newLoginRes.status).toBe(200);

      // Restore original password for other tests
      await request("/api/auth/change-password", {
        method: "POST",
        body: {
          userId: testData.users.profDakar.id,
          currentPassword: "NewSecurePassword123!",
          newPassword: "Admin@123",
          confirmPassword: "Admin@123",
        },
      });
    });
  });

  describe("Password validation rules", () => {
    it("should reject password shorter than 8 characters", async () => {
      const res = await request("/api/auth/change-password", {
        method: "POST",
        body: {
          userId: testData.users.profDakar.id,
          currentPassword: "Admin@123",
          newPassword: "Short1!",
          confirmPassword: "Short1!",
        },
      });

      expect(res.status).toBe(400);
      const data = res.data as { error?: { code?: string } };
      expect(data.error?.code).toBe("VALIDATION_ERROR");
    });

    it("should reject when new password matches current password", async () => {
      const res = await request("/api/auth/change-password", {
        method: "POST",
        body: {
          userId: testData.users.profDakar.id,
          currentPassword: "Admin@123",
          newPassword: "Admin@123",
          confirmPassword: "Admin@123",
        },
      });

      expect(res.status).toBe(400);
      const data = res.data as { error?: { code?: string } };
      expect(data.error?.code).toBe("VALIDATION_ERROR");
    });

    it("should reject when passwords don't match", async () => {
      const res = await request("/api/auth/change-password", {
        method: "POST",
        body: {
          userId: testData.users.profDakar.id,
          currentPassword: "Admin@123",
          newPassword: "NewPassword123!",
          confirmPassword: "DifferentPassword123!",
        },
      });

      expect(res.status).toBe(400);
      const data = res.data as { error?: { code?: string } };
      expect(data.error?.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Password change side effects", () => {
    it("should revoke all tokens after password change", async () => {
      // Get a mobile token
      const token = await mobileLogin("parent@test.sn", "Admin@123");

      // Verify token works
      const res1 = await request("/api/parent/enfants", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([200, 404]).toContain(res1.status);

      // Change password
      const cookie = await login("parent@test.sn", "Admin@123");
      await authRequest(cookie, "/api/auth/change-password", {
        method: "POST",
        body: {
          userId: testData.users.parent.id,
          currentPassword: "Admin@123",
          newPassword: "NewPassword456!",
          confirmPassword: "NewPassword456!",
        },
      });

      // Old token should be rejected
      const res2 = await request("/api/parent/enfants", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res2.status).toBe(401);

      // Restore password
      const newCookie = await login("parent@test.sn", "NewPassword456!");
      await authRequest(newCookie, "/api/auth/change-password", {
        method: "POST",
        body: {
          userId: testData.users.parent.id,
          currentPassword: "NewPassword456!",
          newPassword: "Admin@123",
          confirmPassword: "Admin@123",
        },
      });
    });

    it("should clear mustChangePassword flag after successful change", async () => {
      const { prisma } = await import("../setup");

      // Verify flag is set
      let user = await prisma.user.findUnique({
        where: { id: testData.users.userMustChange.id },
        select: { mustChangePassword: true },
      });
      expect(user?.mustChangePassword).toBe(true);

      // Change password
      await request("/api/auth/change-password", {
        method: "POST",
        body: {
          userId: testData.users.userMustChange.id,
          currentPassword: "Admin@123",
          newPassword: "ChangedPassword123!",
          confirmPassword: "ChangedPassword123!",
        },
      });

      // Verify flag is cleared
      user = await prisma.user.findUnique({
        where: { id: testData.users.userMustChange.id },
        select: { mustChangePassword: true },
      });
      expect(user?.mustChangePassword).toBe(false);

      // Restore for other tests
      await request("/api/auth/change-password", {
        method: "POST",
        body: {
          userId: testData.users.userMustChange.id,
          currentPassword: "ChangedPassword123!",
          newPassword: "Admin@123",
          confirmPassword: "Admin@123",
        },
      });

      await prisma.user.update({
        where: { id: testData.users.userMustChange.id },
        data: { mustChangePassword: true },
      });
    });
  });
});
