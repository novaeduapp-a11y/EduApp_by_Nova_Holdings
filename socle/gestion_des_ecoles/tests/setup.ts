import { PrismaClient } from "@prisma/client";
import { beforeAll, afterAll, beforeEach } from "vitest";
import * as dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: ".env.test" });

// Ensure AUTH_SECRET is set for tests
if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "test-secret-for-verification-12345678901234567890";
}

// Create a new Prisma client for tests
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Track the current test server instance
let serverInstance: { close: () => Promise<void> } | null = null;

export function setServerInstance(instance: { close: () => Promise<void> }) {
  serverInstance = instance;
}

beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
  console.log("✓ Connected to test database");
});

afterAll(async () => {
  // Close server if running
  if (serverInstance) {
    await serverInstance.close();
  }
  
  // Disconnect from database
  await prisma.$disconnect();
  console.log("✓ Disconnected from test database");
});

beforeEach(async () => {
  // Clean up rate limiting and login attempts before each test for isolation
  await prisma.loginAttempt.deleteMany({});
  await prisma.tokenRevocation.deleteMany({});
  await prisma.twoFactorChallenge.deleteMany({});
  await prisma.session.deleteMany({}); // Clean sessions to prevent interference with mobile token tests
  
  console.log("✓ Reset rate limiting and auth tables");
});
