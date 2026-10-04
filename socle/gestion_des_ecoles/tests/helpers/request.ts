import * as http from "http";
import { encode } from "@auth/core/jwt";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

/**
 * Make an HTTP request to the test server
 */
export async function request(
  path: string,
  options: RequestOptions = {}
): Promise<{ status: number; headers: Record<string, string | string[]>; data: unknown }> {
  // Ensure path starts with /
  if (!path.startsWith("/")) {
    path = "/" + path;
  }

  const url = new URL(path, BASE_URL);
  const { method = "GET", headers = {}, body } = options;

  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    const req = http.request(requestOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode || 500,
            headers: res.headers as Record<string, string | string[]>,
            data: parsed,
          });
        } catch {
          resolve({
            status: res.statusCode || 500,
            headers: res.headers as Record<string, string | string[]>,
            data,
          });
        }
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Login a user and return session cookie
 */
export async function login(email: string, password: string): Promise<string> {
  const res = await request("/api/auth/web-login", {
    method: "POST",
    body: { identifier: email, password },
  });

  if (res.status !== 200) {
    throw new Error(`Login failed: ${JSON.stringify(res.data)}`);
  }

  const cookies = Array.isArray(res.headers["set-cookie"])
    ? res.headers["set-cookie"]
    : res.headers["set-cookie"]
      ? [res.headers["set-cookie"]]
      : [];

  const sessionCookie = cookies.find((c) => c.includes("authjs.session-token"));

  if (!sessionCookie) {
    throw new Error("No session cookie returned");
  }

  return sessionCookie.split(";")[0];
}

/**
 * Login via mobile endpoint and return bearer token
 */
export async function mobileLogin(email: string, password: string): Promise<string> {
  const res = await request("/api/mobile/login", {
    method: "POST",
    body: { identifier: email, password },
  });

  if (res.status !== 200) {
    throw new Error(`Mobile login failed: ${JSON.stringify(res.data)}`);
  }

  const data = res.data as { data?: { token?: string } };
  const token = data?.data?.token;

  if (!token) {
    throw new Error("No token returned from mobile login");
  }

  return token;
}

/**
 * Make an authenticated request with session cookie
 */
export async function authRequest(
  cookie: string,
  path: string,
  options: RequestOptions = {}
): Promise<{ status: number; headers: Record<string, string | string[]>; data: unknown }> {
  return request(path, {
    ...options,
    headers: {
      ...options.headers,
      Cookie: cookie,
    },
  });
}

/**
 * Make an authenticated request with bearer token
 */
export async function tokenRequest(
  token: string,
  path: string,
  options: RequestOptions = {}
): Promise<{ status: number; headers: Record<string, string | string[]>; data: unknown }> {
  return request(path, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => Promise<boolean> | boolean,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Sleep for a given duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract value from response data
 */
export function extractData<T = unknown>(
  response: { data: unknown },
  path?: string
): T {
  let value = response.data;

  if (path) {
    const parts = path.split(".");
    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined as T;
      }
    }
  }

  return value as T;
}
