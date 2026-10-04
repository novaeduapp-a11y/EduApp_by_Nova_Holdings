import { spawn, ChildProcess } from "child_process";
import { setServerInstance } from "./setup";

let serverProcess: ChildProcess | null = null;
const SERVER_PORT = 3000;
const SERVER_STARTUP_TIMEOUT = 60000; // 60 seconds

/**
 * Wait for server to be ready
 */
async function waitForServer(timeout: number): Promise<void> {
  const startTime = Date.now();
  const http = await import("http");

  while (Date.now() - startTime < timeout) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.request(
          {
            hostname: "localhost",
            port: SERVER_PORT,
            path: "/api/parametres",
            method: "GET",
          },
          (res) => {
            if (res.statusCode && res.statusCode < 500) {
              resolve();
            } else {
              reject(new Error(`Server returned ${res.statusCode}`));
            }
          }
        );
        req.on("error", reject);
        req.end();
      });

      console.log("✓ Server is ready");
      return;
    } catch (error) {
      // Server not ready yet, wait and retry
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new Error(`Server failed to start within ${timeout}ms`);
}

/**
 * Start the Next.js development server for testing
 */
export async function startTestServer(): Promise<void> {
  console.log("Starting test server...");

  // Check if server is already running
  try {
    await waitForServer(2000);
    console.log("Server already running");
    return;
  } catch {
    // Server not running, start it
  }

  return new Promise((resolve, reject) => {
    serverProcess = spawn("npm", ["run", "dev"], {
      env: {
        ...process.env,
        NODE_ENV: "test",
        PORT: String(SERVER_PORT),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    let errorOutput = "";

    if (serverProcess.stdout) {
      serverProcess.stdout.on("data", (data) => {
        output += data.toString();
        // Look for ready indicator
        if (output.includes("Ready") || output.includes("started server")) {
          waitForServer(SERVER_STARTUP_TIMEOUT)
            .then(() => {
              setServerInstance({
                close: async () => {
                  if (serverProcess) {
                    serverProcess.kill();
                    serverProcess = null;
                  }
                },
              });
              resolve();
            })
            .catch(reject);
        }
      });
    }

    if (serverProcess.stderr) {
      serverProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });
    }

    serverProcess.on("error", (error) => {
      console.error("Failed to start server:", error);
      reject(error);
    });

    serverProcess.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        console.error("Server exited with code:", code);
        console.error("Output:", output);
        console.error("Errors:", errorOutput);
        reject(new Error(`Server exited with code ${code}`));
      }
    });

    // Timeout if server doesn't start
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        console.error("Server startup timeout");
        console.error("Output:", output);
        console.error("Errors:", errorOutput);
        reject(new Error("Server startup timeout"));
      }
    }, SERVER_STARTUP_TIMEOUT);
  });
}

/**
 * Stop the test server
 */
export async function stopTestServer(): Promise<void> {
  if (serverProcess) {
    console.log("Stopping test server...");
    serverProcess.kill();
    serverProcess = null;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startTestServer()
    .then(() => console.log("Test server started successfully"))
    .catch((error) => {
      console.error("Failed to start test server:", error);
      process.exit(1);
    });
}
