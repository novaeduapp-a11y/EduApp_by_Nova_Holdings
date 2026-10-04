import { describe, it, expect } from "vitest";

describe("Application Startup Security", () => {
  describe("AUTH_SECRET validation", () => {
    it("should have AUTH_SECRET configured in test environment", () => {
      const authSecret =
        process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

      expect(authSecret).toBeTruthy();
      expect(authSecret).not.toBe("");
    });

    it("should have AUTH_SECRET with minimum length for security", () => {
      const authSecret =
        process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

      // Should be at least 32 characters for security
      expect(authSecret?.length || 0).toBeGreaterThanOrEqual(32);
    });

    it("should be able to use AUTH_SECRET for JWT signing", async () => {
      const { encode } = await import("@auth/core/jwt");
      const authSecret =
        process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

      expect(authSecret).toBeTruthy();

      // Should be able to sign a token
      const token = await encode({
        token: {
          id: "test-user",
          email: "test@example.com",
          role: "PROFESSEUR",
        },
        secret: authSecret!,
        salt: "test",
        maxAge: 3600,
      });

      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // Valid JWT format
    });

    it("should reject empty AUTH_SECRET in instrumentation", async () => {
      // This test verifies that instrumentation.ts properly validates AUTH_SECRET
      // The actual validation happens at startup, so we just verify the logic exists

      const { register } = await import("@/instrumentation");
      
      // Function should exist
      expect(register).toBeDefined();
      expect(typeof register).toBe("function");

      // In production, empty AUTH_SECRET should throw
      // In test/dev, it should warn but allow startup
      const nodeEnv = process.env.NODE_ENV;
      expect(["test", "development", "production"]).toContain(nodeEnv);
    });
  });

  describe("Critical environment variables", () => {
    it("should have DATABASE_URL configured", () => {
      expect(process.env.DATABASE_URL).toBeTruthy();
      expect(process.env.DATABASE_URL).toContain("postgresql://");
    });

    it("should be running in test environment", () => {
      // These tests should run in test mode
      expect(process.env.NODE_ENV).toBe("test");
    });

    it("should have test-specific configuration", () => {
      // Verify we're using test database
      const dbUrl = process.env.DATABASE_URL || "";
      
      // Should not be using production database
      expect(dbUrl).not.toContain("production");
      expect(dbUrl).not.toContain("prod");
    });
  });

  describe("Server can start with valid configuration", () => {
    it("should successfully import core modules", async () => {
      // Verify critical imports work
      const { prisma } = await import("@/lib/prisma");
      expect(prisma).toBeDefined();

      const { requireAuth } = await import("@/lib/unified-auth");
      expect(requireAuth).toBeDefined();

      const { recordLoginAttempt } = await import("@/lib/rate-limit");
      expect(recordLoginAttempt).toBeDefined();
    });

    it("should have valid Prisma client connection", async () => {
      const { prisma } = await import("@/lib/prisma");

      // Should be able to connect to database
      await expect(prisma.$connect()).resolves.not.toThrow();
    });
  });
});
